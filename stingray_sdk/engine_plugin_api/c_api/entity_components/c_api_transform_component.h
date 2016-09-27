#pragma once

#include "../c_api_types.h"

#ifdef __cplusplus
extern "C" {
#endif

struct TransformComponentCApi
{
	TransformComponentPtr	(*component) (WorldPtr);

	InstanceId	(*create) (TransformComponentPtr, EntityRef);
	void		(*destroy) (TransformComponentPtr, EntityRef);
	int			(*has_instance) (TransformComponentPtr, EntityRef);

	/*	All property keys should be in the format of const char*	*/
	void		(*set_property) (TransformComponentPtr, EntityRef, struct EntityPropertyParameter*, unsigned num_args, ...);
	struct EntityPropertyValue (*get_property) (DataComponentPtr, EntityRef, unsigned num_args, ...);

	// Fills the specified buffer with up to (buffer_size) number of children of the component.
	// Returns the total number of children the component has.
	unsigned	(*children) (TransformComponentPtr, EntityRef parent, EntityRef *buffer, unsigned buffer_size);

	EntityRef	(*parent) (TransformComponentPtr, EntityRef child);
	void		(*unlink) (TransformComponentPtr, EntityRef child);
	void		(*link) (TransformComponentPtr, EntityRef child, EntityRef parent, ConstLocalTransformPtr child_local_pose);
	void		(*link_to_scene_graph) (TransformComponentPtr, EntityRef child, EntityRef parent, unsigned parent_node_index, ConstLocalTransformPtr child_local_pose);

	void		(*set_local_position) (TransformComponentPtr, EntityRef, ConstVector3Ptr);
	void		(*set_local_rotation) (TransformComponentPtr, EntityRef, ConstQuaternionPtr);
	void		(*set_local_scale) (TransformComponentPtr, EntityRef, ConstVector3Ptr);
	void		(*set_local_pose) (TransformComponentPtr, EntityRef, ConstLocalTransformPtr);

	ConstVector3Ptr			(*local_position) (TransformComponentPtr, EntityRef);
	CApiQuaternion			(*local_rotation) (TransformComponentPtr, EntityRef);
	ConstVector3Ptr			(*local_scale) (TransformComponentPtr, EntityRef);
	ConstLocalTransformPtr	(*local_pose) (TransformComponentPtr, EntityRef);

	ConstVector3Ptr			(*world_position) (TransformComponentPtr, EntityRef);
	CApiQuaternion			(*world_rotation) (TransformComponentPtr, EntityRef);
	ConstMatrix4x4Ptr		(*world_pose) (TransformComponentPtr, EntityRef);
};

#ifdef __cplusplus
}
#endif
