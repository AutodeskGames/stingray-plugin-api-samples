#pragma once

#include "../c_api_types.h"

#ifdef __cplusplus
extern "C" {
#endif

struct ActorComponentCApi
{
	ActorComponentPtr	(*component) (WorldPtr);

	InstanceId	(*create) (ActorComponentPtr, EntityRef);
	void		(*destroy) (ActorComponentPtr, EntityRef, InstanceId);
	unsigned	(*instances) (ActorComponentPtr, EntityRef, InstanceId *buffer, unsigned buffer_size);

	/*	All property keys should be in the format of const char*	*/
	void		(*set_property) (ActorComponentPtr, EntityRef, InstanceId, struct EntityPropertyParameter*, unsigned num_args, ...);
	struct EntityPropertyValue (*get_property) (DataComponentPtr, EntityRef, InstanceId, unsigned num_args, ...);

	InstanceId	(*create_capsule) (ActorComponentPtr, EntityRef, ConstMatrix4x4Ptr pose, float radius, float height, unsigned actor_template_id32, unsigned shape_template_id32, unsigned material_template_id32);
	InstanceId	(*create_plane) (ActorComponentPtr, EntityRef, ConstMatrix4x4Ptr pose, ConstVector3Ptr normal, unsigned actor_template_id32, unsigned shape_template_id32, unsigned material_template_id32);
	InstanceId	(*create_box) (ActorComponentPtr, EntityRef, ConstMatrix4x4Ptr pose, ConstVector3Ptr half_extents, unsigned actor_template_id32, unsigned shape_template_id32, unsigned material_template_id32);
	InstanceId	(*create_sphere) (ActorComponentPtr, EntityRef, ConstMatrix4x4Ptr pose, float radius, unsigned actor_template_id32, unsigned shape_template_id32, unsigned material_template_id32);
};

#ifdef __cplusplus
}
#endif
