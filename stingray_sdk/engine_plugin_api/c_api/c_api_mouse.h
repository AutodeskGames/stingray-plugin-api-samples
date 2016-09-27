#pragma once

#ifdef __cplusplus
extern "C" {
#endif

struct MouseCApi
{
	unsigned	(*num_buttons) ();
	const char* (*name) ();
	const char* (*category) ();
	const char* (*type) ();

	float		(*button) (unsigned id);
	int			(*pressed) (unsigned id);
	int			(*released) (unsigned id);

	unsigned	(*any_pressed) ();
	unsigned	(*any_released) ();

	const char* (*button_name) (unsigned i);
	const char* (*button_locale_name) (unsigned i);
	unsigned	(*button_id) (unsigned name_id32);
};

#ifdef __cplusplus
}
#endif


