#pragma once

#include "c_api_types.h"

#ifdef __cplusplus
extern "C" {
#endif

struct ActorCApi
{
	int		(*is_collision_enabled) (ActorPtr);
	int		(*is_scene_query_enabled) (ActorPtr);
	int		(*is_gravity_enabled) (ActorPtr);

	void	(*set_collision_enabled) (ActorPtr, int enabled);
	void	(*set_scene_query_enabled) (ActorPtr, int enabled);
	void	(*set_gravity_enabled) (ActorPtr, int enabled);

	int		(*is_static) (ActorPtr);
	int		(*is_dynamic) (ActorPtr);
	int		(*is_physical) (ActorPtr);
	int		(*is_kinematic) (ActorPtr);
	void	(*set_kinematic) (ActorPtr, int enabled);

	float	(*mass) (ActorPtr);
	float	(*linear_damping) (ActorPtr);
	float	(*angular_damping) (ActorPtr);
	void	(*set_linear_damping) (ActorPtr, float value);
	void	(*set_angular_damping) (ActorPtr, float value);
	CApiVector3	(*center_of_mass) (ActorPtr);

	CApiVector3	 (*position) (ActorPtr);
	CApiQuaternion (*rotation) (ActorPtr);
	CApiMatrix4x4	 (*pose) (ActorPtr);

	void	(*teleport_position) (ActorPtr, ConstVector3Ptr);
	void	(*teleport_rotation) (ActorPtr, ConstQuaternionPtr);
	void	(*teleport_pose) (ActorPtr, ConstMatrix4x4Ptr);

	void	(*set_velocity) (ActorPtr, ConstVector3Ptr);
	void	(*set_angular_velocity) (ActorPtr, ConstVector3Ptr);

	CApiVector3 (*velocity) (ActorPtr);
	CApiVector3 (*angular_velocity) (ActorPtr);
	CApiVector3 (*point_velocity) (ActorPtr, ConstVector3Ptr point);

	void	(*add_impulse) (ActorPtr, ConstVector3Ptr);
	void	(*add_velocity) (ActorPtr, ConstVector3Ptr);
	void	(*add_torque_impulse) (ActorPtr, ConstVector3Ptr);
	void	(*add_angular_velocity) (ActorPtr, ConstVector3Ptr);

	void	(*add_impulse_at) (ActorPtr, ConstVector3Ptr impulse, ConstVector3Ptr position);
	void	(*add_velocity_at) (ActorPtr, ConstVector3Ptr velocity, ConstVector3Ptr position);

	void	(*push) (ActorPtr, ConstVector3Ptr velocity, float mass);
	void	(*push_at) (ActorPtr, ConstVector3Ptr velocity, float mass, ConstVector3Ptr position);

	int		(*is_sleeping) (ActorPtr);
	void	(*wake_up) (ActorPtr);
	void	(*put_to_sleep) (ActorPtr);

	void	(*debug_draw) (ActorPtr, LineObjectPtr, ConstVector4Ptr optional_color, ConstMatrix4x4Ptr optional_camera_pose);

	UnitRef	 (*unit) (ActorPtr);
	unsigned (*node) (ActorPtr);
	void	 (*set_collision_filter) (ActorPtr, unsigned collision_filter_id32);
};

#ifdef __cplusplus
}
#endif
