#pragma once

#include "../c_api_types.h"

#ifdef __cplusplus
extern "C" {
#endif

struct DataComponentCApi
{
	DataComponentPtr		(*component) ();

	InstanceId	(*create) (DataComponentPtr, EntityRef);
	void		(*destroy) (DataComponentPtr, EntityRef, InstanceId);
	unsigned	(*instances) (DataComponentPtr, EntityRef, InstanceId *buffer, unsigned buffer_size);

	/*	All property keys should be in the format of const char*	*/
	void		(*set_property) (DataComponentPtr, EntityRef, InstanceId, struct EntityPropertyParameter*, unsigned num_args, ...);
	struct EntityPropertyValue (*get_property) (DataComponentPtr, EntityRef, InstanceId, unsigned num_args, ...);
};

#ifdef __cplusplus
}
#endif
