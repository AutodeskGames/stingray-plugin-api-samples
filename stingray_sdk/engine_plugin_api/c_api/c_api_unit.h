#pragma once

#include "c_api_types.h"

#ifdef __cplusplus
extern "C" {
#endif

enum UnitCApi_VisibilityContext
{
	UVC_DEFAULT = 1,
	UVC_SHADOW_CASTER = 2,
	UVC_OCCLUDER = 4,
	UVC_ALL = 255
};

struct UnitCApi
{
	ConstVector3Ptr			(*local_position) (UnitRef, unsigned index);
	CApiQuaternion (*local_rotation) (UnitRef, unsigned index);
	ConstVector3Ptr			(*local_scale) (UnitRef, unsigned index);
	ConstLocalTransformPtr  (*local_pose) (UnitRef, unsigned index);

	void	(*set_local_position) (UnitRef, unsigned index, ConstVector3Ptr);
	void	(*set_local_rotation) (UnitRef, unsigned index, ConstQuaternionPtr);
	void	(*set_local_scale) (UnitRef, unsigned index, ConstVector3Ptr);
	void	(*set_local_pose) (UnitRef, unsigned index, ConstLocalTransformPtr);

	ConstVector3Ptr			(*world_position) (UnitRef, unsigned index);
	ConstMatrix4x4Ptr		(*world_pose) (UnitRef, unsigned index);
	// Performance-warning; Fetches the world_pose, extracts a Matrix3x3 from it and returns a copy on the stack.
	CApiQuaternion (*world_rotation) (UnitRef, unsigned index);

	void	(*teleport_local_position) (UnitRef, unsigned index, ConstVector3Ptr);
	void	(*teleport_local_rotation) (UnitRef, unsigned index, ConstQuaternionPtr);
	void	(*teleport_local_scale) (UnitRef, unsigned index, ConstVector3Ptr);
	void	(*teleport_local_pose) (UnitRef, unsigned index, ConstLocalTransformPtr);

	CApiVector3	(*delta_position) (UnitRef, unsigned index);
	CApiQuaternion (*delta_rotation) (UnitRef, unsigned index);
	struct CApiMatrix4x4 (*delta_pose) (UnitRef, unsigned index);

	ActorPtr	(*create_actor) (UnitRef, unsigned index, float inherit_velocity);
	void		(*destroy_actor) (UnitRef, unsigned index);
	unsigned	(*num_actors) (UnitRef);
	unsigned	(*find_actor) (UnitRef, unsigned actor_name_id32);
	ActorPtr	(*actor) (UnitRef, unsigned index);

	unsigned	(*num_movers) (UnitRef);
	unsigned	(*find_mover) (UnitRef, unsigned mover_name_id32);
	MoverPtr	(*set_mover) (UnitRef, unsigned index);
	void		(*set_mover_to_none) (UnitRef);
	MoverPtr	(*mover) (UnitRef);
	struct MoverFitsAtResult (*mover_fits_at) (UnitRef, unsigned index, ConstVector3Ptr, float permitted_move_threshold);

	void		(*trigger_flow_event) (UnitRef, unsigned event_name_id32);
	void*		(*flow_variable) (UnitRef, unsigned variable_name_id32);
	void		(*set_flow_variable) (UnitRef, unsigned variable_name_id32, void* value);

	uint64_t	(*set_material) (UnitRef, unsigned slot_name_id32, uint64_t material_resource_name_id64, const char *optional_debug_material_resource_name);
	uint64_t	(*set_material_to_none) (UnitRef, unsigned slot_name_id32);

	unsigned	(*num_meshes) (UnitRef);
	unsigned	(*find_mesh) (UnitRef, unsigned mesh_name_id32);
	MeshPtr		(*mesh) (UnitRef, unsigned index);

	struct BoneNamesWrapper	(*bones) (UnitRef);
	CApiMatrix4x4	(*animation_wanted_root_pose) (UnitRef);
	void	(*animation_set_bones_lod) (UnitRef, unsigned);

	enum AnimationBoneRootMode (*animation_root_mode) (UnitRef);
	enum AnimationBoneRootMode (*animation_bone_mode) (UnitRef);

	void		(*set_animation_root_mode) (UnitRef, enum AnimationBoneRootMode);
	void		(*set_animation_bone_mode) (UnitRef, enum AnimationBoneRootMode);

	unsigned	(*animation_find_constraint_target) (UnitRef, unsigned constraint_target_name_id32);
	ConstMatrix4x4Ptr (*animation_get_constraint_target) (UnitRef, unsigned index);
	void		(*animation_set_constraint_target_pose) (UnitRef, unsigned index, ConstMatrix4x4Ptr);
	void		(*animation_set_constraint_target_position) (UnitRef, unsigned index, ConstVector3Ptr);
	void		(*animation_set_constraint_target_rotation) (UnitRef, unsigned index, ConstQuaternionPtr);

	unsigned	(*crossfade_animation) (UnitRef, uint64_t animation_name_id64, const char *optional_debug_animation_name, unsigned layer, float blend_time, int should_loop, enum AnimationBlendType);
	unsigned	(*is_crossfading_animation) (UnitRef);
	void		(*crossfade_animation_set_time) (UnitRef, unsigned id, float time, int should_cap_to_range);
	void		(*crossfade_animation_set_speed) (UnitRef, unsigned id, float speed);

	void		(*disable_state_machine) (UnitRef);
	void		(*enable_state_machine) (UnitRef);
	void		(*set_state_machine) (UnitRef, uint64_t machine_name_id64, const char *optional_debug_machine_name);
	int			(*has_state_machine) (UnitRef);
	int			(*has_event) (UnitRef, unsigned event_name_id32);

	void		(*trigger_event) (UnitRef, unsigned event_name_id32);
	void		(*trigger_event_with_parameters) (UnitRef, unsigned event_name_id32, unsigned key, float value);

	unsigned	(*animation_find_variable) (UnitRef, unsigned variable_name_id32);
	float		(*animation_get_variable) (UnitRef, unsigned index);
	void		(*animation_set_variable) (UnitRef, unsigned index, float value);

	void		(*animation_set_state) (UnitRef, struct AnimationStates*);
	struct AnimationStates (*animation_get_state) (UnitRef);

	void(*animation_set_seeds) (UnitRef, struct AnimationLayerSeeds*);
	struct AnimationLayerSeeds(*animation_get_seeds) (UnitRef);

	struct AnimationLayerInfo (*animation_layer_info) (UnitRef, unsigned index);
	void		(*set_merge_options) (UnitRef, float max_start_time, float max_drift, float clock_fidelity);

	unsigned	(*num_terrains) (UnitRef);
	unsigned	(*find_terrain) (UnitRef, unsigned terrain_name_id32);
	TerrainPtr	(*terrain) (UnitRef, unsigned index);

	JointPtr	(*create_joint) (UnitRef, unsigned joint_name_id32);
	void		(*destroy_joint) (UnitRef, unsigned joint_name_id32);
	JointPtr	(*create_custom_joint) (UnitRef, unsigned joint_name_id32, ActorPtr optional_actor_1, ActorPtr optional_actor_2, ConstVector3Ptr optional_anchor_1,
										ConstVector3Ptr optional_anchor_2, ConstVector3Ptr optional_global_anchor, ConstVector3Ptr optional_global_axis);

	/*		All property names should be in the format of const char*	*/
	void		(*set_property) (UnitRef, float value, unsigned num_args, ...);
	float		(*get_property) (UnitRef, unsigned num_args, ...);

	unsigned	(*num_scene_graph_items) (UnitRef);
	unsigned	(*find_scene_graph_parent) (UnitRef, unsigned index);
	void		(*scene_graph_link) (UnitRef, unsigned index, unsigned parent_index);
	void		(*scene_graph_link_to_none) (UnitRef, unsigned index);
	void		(*copy_scene_graph_local_from) (UnitRef destination, UnitRef source);

	unsigned		(*num_lod_objects) (UnitRef);
	unsigned		(*find_lod_object) (UnitRef, unsigned lod_name_id32);
	LodObjectPtr	(*lod_object) (UnitRef, unsigned index);

	unsigned	(*num_lights) (UnitRef);
	unsigned	(*find_light) (UnitRef, unsigned light_name_id32);
	LightPtr	(*light) (UnitRef, unsigned index);

	VehiclePtr	(*create_vehicle) (UnitRef);
	void		(*destroy_vehicle) (UnitRef);
	int			(*has_vehicle) (UnitRef);
	VehiclePtr	(*vehicle) (UnitRef);

	void		(*enable_physics) (UnitRef);
	void		(*disable_physics) (UnitRef);
	void		(*apply_initial_actor_velocities) (UnitRef, int should_wake_sleeping_actors);

	void		(*set_unit_visibility) (UnitRef, int enabled);
	void		(*set_mesh_visibility) (UnitRef, unsigned index, enum UnitCApi_VisibilityContext, int enabled);
	void		(*set_cloth_visibility) (UnitRef, unsigned index, enum UnitCApi_VisibilityContext, int enabled);
	void		(*set_visibility) (UnitRef, unsigned group_name_id32, int enabled);
	int			(*has_visibility_group) (UnitRef, unsigned group_name_id32);

	ClothPtr	(*create_cloth) (UnitRef, unsigned index);
	void		(*destroy_cloth) (UnitRef, unsigned index);
	unsigned	(*num_clothes) (UnitRef);
	unsigned	(*find_cloth) (UnitRef, unsigned cloth_name_id32);
	ClothPtr	(*cloth) (UnitRef, unsigned index);

	unsigned	(*num_cameras) (UnitRef);
	unsigned	(*find_camera) (UnitRef, unsigned camera_name_id32);
	CameraPtr	(*camera) (UnitRef, unsigned index);

	int			(*has_node) (UnitRef, unsigned node_name_id32);
	unsigned	(*node) (UnitRef, unsigned node_name_id32);

	WorldPtr	(*world) (UnitRef);
	LevelPtr	(*level) (UnitRef);
	int			(*is_alive) (UnitRef);
	double		(*id_in_level) (UnitRef);
	int			(*is_of_resource_type) (UnitRef, uint64_t resource_name);

	struct OOBBWrapper (*box) (UnitRef);
};
#ifdef __cplusplus
}
#endif
