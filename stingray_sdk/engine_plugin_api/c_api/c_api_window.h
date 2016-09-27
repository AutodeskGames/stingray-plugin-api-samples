#pragma once

#include "c_api_types.h"

#ifdef __cplusplus
extern "C" {
#endif

struct WindowCApi
{
	int		(*has_mouse_focus) (ConstWindowPtr optional);
	int		(*has_focus) (ConstWindowPtr optional);
	void	(*set_mouse_focus) (WindowPtr optional, int enabled);
	void	(*set_focus) (WindowPtr optional);

	int		(*show_cursor) (WindowPtr optional);
	int		(*clip_cursor) (WindowPtr optional);
	void	(*set_cursor) (WindowPtr optional, const char* optional_mouse_cursor);
	void	(*set_show_cursor) (WindowPtr optional, int enabled);
	void	(*set_clip_cursor)(WindowPtr optional, int enabled);

	int		(*is_resizable)(ConstWindowPtr optional);
	void	(*set_resizable) (WindowPtr optional, int enabled);
	void	(*set_resolution) (WindowPtr optional, unsigned width, unsigned height);

	void	(*set_title) (WindowPtr optional, const char* title);
	int		(*has_window) (ConstWindowPtr);
	WindowPtr (*get_main_window)();

	void	(*minimize) (WindowPtr optional);
	void	(*maximize) (WindowPtr optional);
	void	(*restore) (WindowPtr optional);
	int		(*is_closing) (WindowPtr optional);
	void	(*close) (WindowPtr optional);
	void	(*trigger_resize) (WindowPtr optional);
	void	(*set_ime_enabled) (WindowPtr optional, int enabled);
	void	(*set_foreground) (WindowPtr optional);
	void	(*set_keystroke_enabled) (enum WindowKeystrokes, int enabled);
	void	(*fill_default_open_parameter) (struct WindowOpenParameter* out_result);
	unsigned (*id) (WindowPtr optional);
	WindowPtr (*open) (struct WindowOpenParameter* const);
	struct WindowRectWrapper (*rect) (WindowPtr optional);
	void	(*set_rect)(WindowPtr optional, struct WindowRectWrapper rect);
};

#ifdef __cplusplus
}
#endif
