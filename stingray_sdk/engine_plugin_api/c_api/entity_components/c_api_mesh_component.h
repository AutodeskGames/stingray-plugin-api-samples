#pragma once

#include "../c_api_types.h"

#ifdef __cplusplus
extern "C" {
#endif

struct MeshComponentCApi
{
	MeshComponentPtr	(*component) (WorldPtr);

	InstanceId	(*create) (MeshComponentPtr, EntityRef);
	void		(*destroy) (MeshComponentPtr, EntityRef, InstanceId);
	unsigned	(*instances) (MeshComponentPtr, EntityRef, InstanceId *buffer, unsigned buffer_size);

	/*	All property keys should be in the format of const char*	*/
	void		(*set_property) (MeshComponentPtr, EntityRef, InstanceId, struct EntityPropertyParameter*, unsigned num_args, ...);
	struct EntityPropertyValue (*get_property) (DataComponentPtr, EntityRef, InstanceId, unsigned num_args, ...);

	InstanceId	(*create_with_mesh) (MeshComponentPtr, EntityRef, uint64_t scene_resource_id64, unsigned mesh_name_id32);
	void		(*set_material) (MeshComponentPtr, EntityRef, InstanceId, unsigned key_id32, uint64_t material_resource_id64, unsigned material_id32);
};

#ifdef __cplusplus
}
#endif
