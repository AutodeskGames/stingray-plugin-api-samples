#pragma once

#include "../c_api_types.h"

#ifdef __cplusplus
extern "C" {
#endif

struct AnimationStateMachineComponentCApi
{
	AnimationStateMachineComponentPtr	(*component) (WorldPtr);

	InstanceId	(*create) (AnimationStateMachineComponentPtr, EntityRef);
	void		(*destroy) (AnimationStateMachineComponentPtr, EntityRef);
	int			(*has_instance) (AnimationStateMachineComponentPtr, EntityRef);

	/*	All property keys should be in the format of const char*	*/
	void		(*set_property) (AnimationStateMachineComponentPtr, EntityRef, struct EntityPropertyParameter*, unsigned num_args, ...);
	struct EntityPropertyValue (*get_property) (DataComponentPtr, EntityRef, unsigned num_args, ...);

	int			(*has_event) (AnimationStateMachineComponentPtr, EntityRef, unsigned event_name_id32);
	void		(*trigger_event) (AnimationStateMachineComponentPtr, EntityRef, unsigned event_name_id32, const char *opt_event_plain_name);
	unsigned	(*find_variable) (AnimationStateMachineComponentPtr, EntityRef, unsigned variable_name_id32);
	float		(*get_variable) (AnimationStateMachineComponentPtr, EntityRef, unsigned index);
	void		(*set_variable) (AnimationStateMachineComponentPtr, EntityRef, unsigned index, float value);
	void		(*set_logging) (AnimationStateMachineComponentPtr, EntityRef, int enabled);
	void		(*set_constraint_target) (AnimationStateMachineComponentPtr, EntityRef, unsigned index, ConstMatrix4x4Ptr pose);
	void		(*set_constraint_target_position) (AnimationStateMachineComponentPtr, EntityRef, unsigned index, ConstVector3Ptr pos);
	void		(*set_constraint_target_rotation) (AnimationStateMachineComponentPtr, EntityRef, unsigned index, ConstQuaternionPtr rot);
	ConstMatrix4x4Ptr	(*get_constraint_target) (AnimationStateMachineComponentPtr, EntityRef, unsigned index);
};

#ifdef __cplusplus
}
#endif
