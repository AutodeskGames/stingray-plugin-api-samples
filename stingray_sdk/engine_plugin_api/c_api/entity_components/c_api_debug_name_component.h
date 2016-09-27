#pragma once

#include "../c_api_types.h"

#ifdef __cplusplus
extern "C" {
#endif

struct DebugNameComponentCApi
{
	DebugNameComponentPtr	(*component) ();

	InstanceId	(*create) (DebugNameComponentPtr, EntityRef);
	void		(*destroy) (DebugNameComponentPtr, EntityRef);
	int			(*has_instance) (DebugNameComponentPtr, EntityRef);

	/*	All property keys should be in the format of const char*	*/
	void		(*set_property) (DebugNameComponentPtr, EntityRef, struct EntityPropertyParameter*, unsigned num_args, ...);
	struct EntityPropertyValue (*get_property) (DataComponentPtr, EntityRef, unsigned num_args, ...);
};

#ifdef __cplusplus
}
#endif
