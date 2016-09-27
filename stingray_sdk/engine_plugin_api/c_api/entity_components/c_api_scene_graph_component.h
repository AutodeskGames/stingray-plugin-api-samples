#pragma once

#include "../c_api_types.h"

#ifdef __cplusplus
extern "C" {
#endif

struct SceneGraphComponentCApi
{
	SceneGraphComponentPtr	(*component) (WorldPtr);

	InstanceId	(*create) (SceneGraphComponentPtr, EntityRef);
	void		(*destroy) (SceneGraphComponentPtr, EntityRef);
	int			(*has_instance) (SceneGraphComponentPtr, EntityRef);

	/*	All property keys should be in the format of const char*	*/
	void		(*set_property) (SceneGraphComponentPtr, EntityRef, struct EntityPropertyParameter*, unsigned num_args, ...);
	struct EntityPropertyValue (*get_property) (DataComponentPtr, EntityRef, unsigned num_args, ...);

	unsigned	(*num_nodes) (SceneGraphComponentPtr, EntityRef);
	unsigned	(*node_index) (SceneGraphComponentPtr, EntityRef, unsigned node_name_id32);
	unsigned	(*parent) (SceneGraphComponentPtr, EntityRef, unsigned node_index);

	void		(*set_local_position) (SceneGraphComponentPtr, EntityRef, unsigned node_index, ConstVector3Ptr);
	void		(*set_local_rotation) (SceneGraphComponentPtr, EntityRef, unsigned node_index, ConstQuaternionPtr);
	void		(*set_local_scale) (SceneGraphComponentPtr, EntityRef, unsigned node_index, ConstVector3Ptr);
	void		(*set_local_pose) (SceneGraphComponentPtr, EntityRef, unsigned node_index, ConstLocalTransformPtr);

	ConstVector3Ptr			(*local_position) (SceneGraphComponentPtr, EntityRef, unsigned node_index);
	CApiQuaternion			(*local_rotation) (SceneGraphComponentPtr, EntityRef, unsigned node_index);
	ConstVector3Ptr			(*local_scale) (SceneGraphComponentPtr, EntityRef, unsigned node_index);
	ConstLocalTransformPtr	(*local_pose) (SceneGraphComponentPtr, EntityRef, unsigned node_index);

	ConstVector3Ptr			(*world_position) (SceneGraphComponentPtr, EntityRef, unsigned node_index);
	CApiQuaternion			(*world_rotation) (SceneGraphComponentPtr, EntityRef, unsigned node_index);
	ConstMatrix4x4Ptr		(*world_pose) (SceneGraphComponentPtr, EntityRef, unsigned node_index);
};

#ifdef __cplusplus
}
#endif
