#pragma once

#include "c_api_types.h"

#ifdef __cplusplus
extern "C" {
#endif

enum CameraProjectionType {
	CAMERA_PROJ_ORTHOGRAPHIC,
	CAMERA_PROJ_PERSPECTIVE
};

enum CameraMode {
	CAMERA_MODE_MONO,
	CAMERA_MODE_STEREO
};

struct CameraCApi
{
	ConstVector3Ptr			(*local_position) (ConstCameraPtr);
	CApiQuaternion			(*local_rotation) (ConstCameraPtr);
	ConstVector3Ptr			(*local_scale) (ConstCameraPtr);
	ConstLocalTransformPtr  (*local_pose) (ConstCameraPtr);

	void (*set_local_position) (CameraPtr, UnitRef, ConstVector3Ptr);
	void (*set_local_rotation) (CameraPtr, UnitRef, ConstQuaternionPtr);
	void (*set_local_scale) (CameraPtr, UnitRef, ConstVector3Ptr);
	void (*set_local_pose) (CameraPtr, UnitRef, ConstLocalTransformPtr);

	ConstVector3Ptr		(*world_position) (ConstCameraPtr);
	ConstMatrix4x4Ptr	(*world_pose) (ConstCameraPtr);
	// Performance-warning; Fetches the world_pose, extracts a Matrix3x3 from it and returns a copy on the stack.
	CApiQuaternion		(*world_rotation) (ConstCameraPtr);

	float	(*near_range) (ConstCameraPtr);
	float	(*far_range) (ConstCameraPtr);
	void	(*set_near_range) (CameraPtr, float);
	void	(*set_far_range) (CameraPtr, float);

	float	(*vertical_fov) (ConstCameraPtr, unsigned);
	void	(*set_vertical_fov) (CameraPtr, float, unsigned);

	enum CameraProjectionType	(*projection_type) (ConstCameraPtr);
	void	(*set_projection_type) (CameraPtr, enum CameraProjectionType);
	void	(*set_orthographic_view) (CameraPtr, float min_x, float max_x, float min_z, float max_z, unsigned);
	void	(*set_post_projection_transform) (CameraPtr, ConstMatrix4x4Ptr);


	void	(*set_frustum) (CameraPtr, float left, float right, float bottom, float top, unsigned);
	void	(*set_frustum_half_angles) (CameraPtr, float left_tan, float right_tan, float bottom_tan, float top_tan, unsigned);
	float	(*inside_frustum) (ConstCameraPtr, ConstVector3Ptr, ConstWindowPtr optional);

	unsigned (*node) (ConstCameraPtr);

	enum CameraMode	(*mode)(ConstCameraPtr);
	void			(*set_mode)(CameraPtr, enum CameraMode);
};

#ifdef __cplusplus
}
#endif

