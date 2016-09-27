#pragma once

#include "c_api_types.h"

#ifdef __cplusplus
extern "C" {
#endif
/* This class is solely for managing PS4 Gamepads connected to a PC. */
struct PS4PadCApi
{
	unsigned	(*num_buttons) (unsigned pad);
	const char* (*name) (unsigned pad);
	const char* (*category) (unsigned pad);
	const char* (*type) (unsigned pad);

	float		(*button) (unsigned pad, unsigned id);
	int			(*pressed) (unsigned pad, unsigned id);
	int			(*released) (unsigned pad, unsigned id);

	unsigned	(*any_pressed) (unsigned pad);
	unsigned	(*any_released) (unsigned pad);

	const char* (*button_name) (unsigned pad, unsigned i);
	const char* (*button_locale_name) (unsigned pad, unsigned i);
	unsigned	(*button_id) (unsigned pad, unsigned name_id32);

	const char* (*axis_name) (unsigned pad, unsigned i);
	unsigned	(*axis_id) (unsigned pad, unsigned name_id32);
	unsigned	(*has_axis) (unsigned pad, unsigned name_id32);

	const char* (*rumble_motor_name) (unsigned pad, unsigned i);
	unsigned	(*rumble_motor_index) (unsigned pad, unsigned name_id32);
	int			(*has_rumble_motor) (unsigned pad, unsigned name_id32);
	void		(*set_rumble_enabled) (unsigned pad, int enabled);
	unsigned	(*num_rumble_motors) (unsigned pad);

	void		(*set_rumble) (unsigned pad, unsigned motor_index, float base_value);
	unsigned	(*rumble_effect) (unsigned pad, unsigned motor_index, float frequency, float offset, float attack_level,
		float sustain_level, float attack, float decay, float sustain, float release);
	int			(*is_rumble_effect_playing) (unsigned pad, unsigned motor_index, unsigned effect_id);
	void		(*stop_rumble_effect) (unsigned pad, unsigned motor_index, unsigned effect_id);
	void		(*stop_all_rumble_effects) (unsigned pad, unsigned motor_index);

	void		(*set_down_threshold) (unsigned pad, float t);
	float		(*down_threshold) (unsigned pad);

	int			(*active) (unsigned pad);
	int			(*connected) (unsigned pad);
	int			(*disconnected) (unsigned pad);

	void		(*scan_for_windows_ps4_controllers) ();
};

#ifdef __cplusplus
}
#endif


