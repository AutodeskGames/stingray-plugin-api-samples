#pragma once

#include "c_api_types.h"

#ifdef __cplusplus
extern "C" {
#endif

struct MaterialCApi
{
	void		(*set_scalar) (MaterialPtr, unsigned variable_name_id32, float);
	void		(*set_vector2) (MaterialPtr, unsigned variable_name_id32, ConstVector2Ptr);
	void		(*set_vector3) (MaterialPtr, unsigned variable_name_id32, ConstVector3Ptr);
	void		(*set_vector4) (MaterialPtr, unsigned variable_name_id32, ConstVector4Ptr);
	void		(*set_color) (MaterialPtr, unsigned variable_name_id32, ConstVector4Ptr);

	unsigned	(*material_id) (ConstMaterialPtr);
	void		(*set_shader_pass_flag) (MaterialPtr, unsigned flag_name_id32, int enabled);
	void		(*set_texture) (MaterialPtr, unsigned slot_name_id32, uint64_t texture_resource);
	void		(*set_resource) (MaterialPtr, unsigned slot_name_id32, ConstRenderResourcePtr);
	void		(*set_matrix4x4) (MaterialPtr, unsigned variable_name_id32, ConstMatrix4x4Ptr);
};

#ifdef __cplusplus
}
#endif
