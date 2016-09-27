#pragma once

// Platform names
#define PLATFORM_NAME_WIN32		"win32"
#define PLATFORM_NAME_XB1		"xb1"
#define PLATFORM_NAME_ANDROID	"android"
#define PLATFORM_NAME_MACOSX	"macosx"
#define PLATFORM_NAME_IOS		"ios"
#define PLATFORM_NAME_PS4		"ps4"
#define PLATFORM_NAME_WEBGL		"webgl"
#define PLATFORM_NAME_LINUX		"linux"

#if defined(PS4)
	#define __forceinline __inline__ __attribute__((always_inline))
#endif

#if defined(XBOXONE)
	#include <intrin.h>
	#include <stdint.h>
	__forceinline uint64_t rdtsc(void) { return __rdtsc(); }
#endif

#if defined(IOS)
	#include <errno.h>
#endif

#if defined (IOS) || defined (ANDROID) || defined (WEBGL) || defined(LINUXPC)
	#define nullptr NULL
	#define __forceinline __attribute__((__always_inline__)) inline
#endif
#if defined(ANDROID)
	#define PLUGIN_DLLEXPORT
#else
	#define PLUGIN_DLLEXPORT __declspec(dllexport)
#endif
