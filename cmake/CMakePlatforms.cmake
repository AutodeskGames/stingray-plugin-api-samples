cmake_minimum_required(VERSION 3.6)

# This module is shared; use include blocker.
if( _PLATFORMS_ )
	return()
endif()
set(_PLATFORMS_ 1)

include(CMakeCompiler)

# Detect target platform
if( ${CMAKE_SYSTEM_NAME} STREQUAL "Windows" )
	set(PLATFORM_WINDOWS 1)
	set(PLATFORM_NAME "windows")
	if( MSVC_VERSION GREATER 1800 )
		set(REQUIRED_WINDOWSSDK_VERSION 10.0.10586.0)
		message(STATUS "Windows SDK version found: ${CMAKE_VS_WINDOWS_TARGET_PLATFORM_VERSION}")
		if ( CMAKE_VS_WINDOWS_TARGET_PLATFORM_VERSION VERSION_LESS REQUIRED_WINDOWSSDK_VERSION ) # Versions before this have serious bugs
			message(FATAL_ERROR "Unsupported Windows SDK Version, ${REQUIRED_WINDOWSSDK_VERSION} or greater required")
		endif()
	endif()
else()
	message(FATAL_ERROR "Unknown platform ${CMAKE_SYSTEM_NAME}!")
endif()

message(STATUS "Detected platform: ${PLATFORM_NAME}")

# Detect target architecture
if( ((PLATFORM_WINDOWS OR PLATFORM_OSX OR PLATFORM_UWP) AND CMAKE_CL_64) OR (PLATFORM_IOS AND CMAKE_OSX_ARCHITECTURES MATCHES "arm64") OR PLATFORM_XBOXONE OR PLATFORM_PS4 OR PLATFORM_LINUX )
	set(PLATFORM_64BIT 1)
endif()

if( PLATFORM_WINDOWS OR PLATFORM_OSX OR PLATFORM_LINUX OR PLATFORM_XBOXONE OR PLATFORM_PS4 OR PLATFORM_WEBGL OR PLATFORM_UWP )
	if( PLATFORM_64BIT )
		set(ARCH_NAME "x64")
	else()
		set(ARCH_NAME "x86")
	endif()
elseif( PLATFORM_IOS OR PLATFORM_ANDROID )
	if( PLATFORM_64BIT )
		set(ARCH_NAME "arm64")
	else()
		set(ARCH_NAME "arm")
	endif()
else()
	message(FATAL_ERROR "Unknown platform architecture!")
endif()

message(STATUS "Detected architecture: ${ARCH_NAME}")

if( PLATFORM_64BIT )
	set(ARCH_BITS "64")
	set(ARCH_64BITS "64")
else()
	set(ARCH_BITS "32")
	set(ARCH_64BITS "")
endif()

set(LIB_PREFIX ${CMAKE_STATIC_LIBRARY_PREFIX})
set(LIB_SUFFIX ${CMAKE_STATIC_LIBRARY_SUFFIX})

# Configure CMake global variables
set(CMAKE_INSTALL_MESSAGE LAZY)
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY "${PROJECT_BINARY_DIR}/bin")
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY "${PROJECT_BINARY_DIR}/lib")
set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY "${PROJECT_BINARY_DIR}/lib")
if( PLATFORM_WINDOWS )
	set(CMAKE_VS_INCLUDE_INSTALL_TO_DEFAULT_BUILD 1)
endif()
