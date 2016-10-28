#pragma once

#include "../c_api_types.h"

#ifdef __cplusplus
extern "C" {
#endif

struct RenderDataComponentCApi
{
	RenderDataComponentPtr		(*component) (WorldPtr world);

	InstanceId	(*create) (RenderDataComponentPtr, EntityRef);
	void		(*destroy) (RenderDataComponentPtr, EntityRef, InstanceId);
	unsigned	(*instances) (RenderDataComponentPtr, EntityRef, InstanceId *buffer, unsigned buffer_size);

	/*	All property keys should be in the format of const char*	*/
	void		(*set_property) (RenderDataComponentPtr, EntityRef, InstanceId, struct EntityPropertyParameter*, unsigned num_args, ...);
	struct EntityPropertyValue (*get_property) (RenderDataComponentPtr, EntityRef, InstanceId, unsigned num_args, ...);
};

#ifdef __cplusplus
}
#endif
