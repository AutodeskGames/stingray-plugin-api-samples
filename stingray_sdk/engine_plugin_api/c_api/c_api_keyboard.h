#pragma once

#ifdef __cplusplus
extern "C" {
#endif

enum KeyboardCApi_Keystroke
{
	KA_KS_CHAR_ARROW_LEFT = 1,
	KA_KS_CHAR_ARROW_RIGHT = 2,
	KA_KS_CHAR_ARROW_UP = 3,
	KA_KS_CHAR_ARROW_DOWN = 4,
	KA_KS_CHAR_INSERT = 5,
	KA_KS_CHAR_HOME = 6,
	KA_KS_CHAR_END = 7,
	KA_KS_CHAR_BACKSPACE = 8,
	KA_KS_CHAR_TAB = 9,
	KA_KS_CHAR_PG_UP = 11,
	KA_KS_CHAR_PG_DOWN = 12,
	KA_KS_CHAR_ENTER = 13,
	KA_KS_CHAR_F1 = 14,
	KA_KS_CHAR_F2 = 15,
	KA_KS_CHAR_F3 = 16,
	KA_KS_CHAR_F4 = 17,
	KA_KS_CHAR_F5 = 18,
	KA_KS_CHAR_F6 = 19,
	KA_KS_CHAR_F7 = 20,
	KA_KS_CHAR_F8 = 21,
	KA_KS_CHAR_F9 = 22,
	KA_KS_CHAR_F10 = 23, // magical, does not work
	KA_KS_CHAR_F11 = 24,
	KA_KS_CHAR_F12 = 25,
	KA_KS_CHAR_DELETE = 26,
	KA_KS_CHAR_ESCAPE = 27
};

struct KeyboardCApi
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

	const int*(*keystrokes)(unsigned *num_strokes);
};

#ifdef __cplusplus
}
#endif


