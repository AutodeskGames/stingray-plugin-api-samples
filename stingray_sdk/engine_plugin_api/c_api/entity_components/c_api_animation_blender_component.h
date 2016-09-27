#pragma once

#include "../c_api_types.h"

#ifdef __cplusplus
extern "C" {
#endif

struct AnimationBlenderComponentCApi
{
	AnimationBlenderComponentPtr		(*component) (WorldPtr);

	InstanceId	(*create) (AnimationBlenderComponentPtr, EntityRef);
	void		(*destroy) (AnimationBlenderComponentPtr, EntityRef);
	int			(*has_instance) (AnimationBlenderComponentPtr, EntityRef);

	/*	All property keys should be in the format of const char*	*/
	void		(*set_property) (AnimationBlenderComponentPtr, EntityRef, struct EntityPropertyParameter*, unsigned num_args, ...);
	struct EntityPropertyValue (*get_property) (DataComponentPtr, EntityRef, unsigned num_args, ...);

	unsigned	(*crossfade) (AnimationBlenderComponentPtr, EntityRef, uint64_t animation_name, unsigned layer, float blend_time, int should_loop, enum AnimationBlendType anim_blend_type);
	void		(*set_time) (AnimationBlenderComponentPtr, EntityRef, unsigned id, float time, int should_cap_to_range);
	void		(*set_speed) (AnimationBlenderComponentPtr, EntityRef, unsigned id, float speed);
	int			(*is_crossfading) (AnimationBlenderComponentPtr, EntityRef);
	void		(*set_root_mode) (AnimationBlenderComponentPtr, EntityRef, enum AnimationBoneRootMode);
	void		(*set_bone_mode) (AnimationBlenderComponentPtr, EntityRef, enum AnimationBoneRootMode);
	void		(*set_bones_lod) (AnimationBlenderComponentPtr, EntityRef, unsigned lod_level);
	CApiMatrix4x4		(*delta_transform) (AnimationBlenderComponentPtr, EntityRef);
	enum AnimationBoneRootMode	(*root_mode) (AnimationBlenderComponentPtr, EntityRef);
	enum AnimationBoneRootMode	(*bone_mode) (AnimationBlenderComponentPtr, EntityRef);
};


#ifdef __cplusplus
}
#endif
