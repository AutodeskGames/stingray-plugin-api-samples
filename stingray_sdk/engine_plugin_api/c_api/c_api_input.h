#pragma once

#include "c_api_keyboard.h"
#include "c_api_mouse.h"
#include "c_api_gamepad.h"
#include "c_api_ps4pad.h"

#ifdef __cplusplus
extern "C" {
#endif

struct InputCApi
{
	struct KeyboardCApi* Keyboard;
	struct MouseCApi* Mouse;
	struct GamepadCApi* Gamepad;
	struct PS4PadCApi* PS4Pad;

	void	 (*raw_input_queue) (struct RawInputEventWrapper* buffer, unsigned buffer_size);
	unsigned (*raw_input_queue_size) ();
};

#ifdef __cplusplus
}
#endif
