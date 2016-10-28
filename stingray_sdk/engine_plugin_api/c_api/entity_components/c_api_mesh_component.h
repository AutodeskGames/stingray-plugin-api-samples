#pragma once

#include "../c_api_types.h"

#ifdef __cplusplus
extern "C" {
#endif

struct MeshComponentCApi
{
	MeshComponentPtr	(*component) (WorldPtr);

	InstanceId	(*create) (MeshComponentPtr comp, EntityRef e_ref);
	void		(*destroy) (MeshComponentPtr comp, EntityRef e_ref, InstanceId);
	unsigned	(*instances) (MeshComponentPtr comp, EntityRef e_ref, InstanceId *buffer, unsigned buffer_size);

	/*	All property keys should be in the format of const char*	*/
	void		(*set_property) (MeshComponentPtr comp, EntityRef e_ref, InstanceId, struct EntityPropertyParameter*, unsigned num_args, ...);
	struct EntityPropertyValue (*get_property) (DataComponentPtr, EntityRef, InstanceId, unsigned num_args, ...);

	InstanceId	(*create_with_mesh) (MeshComponentPtr comp, EntityRef e_ref, uint64_t scene_resource_id64, const char *optional_debug_scene_resource_name, unsigned mesh_name_id32, const char *optional_debug_mesh_name);
	void		(*set_material) (MeshComponentPtr comp, EntityRef e_ref, InstanceId id, unsigned key_id32, uint64_t material_resource_id64, const char *optional_debug_material_resource_name, unsigned material_id32, const char *optional_debug_material_name);
};

#ifdef __cplusplus
}
#endif
