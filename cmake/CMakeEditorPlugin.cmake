cmake_minimum_required(VERSION 3.6)
project(stingray_editor)

include(CMakeSettings)
if( PLATFORM_WINDOWS )
	project(stingray_editor_win${ARCH_BITS})
else()
	project(stingray_editor_${PLATFORM_NAME})
endif()

# Setup platforms
if( PLATFORM_WINDOWS )
	add_definitions(-DWINDOWSPC)
elseif( PLATFORM_OSX )
	add_definitions(-DMACOSX)
endif()

if( EDITOR_SHIPPING )
	add_definitions(-DSTINGRAY_SHIPPING)
endif()

# Set folder names inside solution files
set(EDITOR_USE_SOLUTION_FOLDERS ON)
set(EDITOR_CORE_FOLDER_NAME "platform")
set(EDITOR_APP_FOLDER_NAME "application")
set(EDITOR_NATIVE_EXTENSIONS_FOLDER_NAME "native_extensions")

# Allow subfolders in solution file
if ( EDITOR_USE_SOLUTION_FOLDERS )
	set_property(GLOBAL PROPERTY USE_FOLDERS ON)
	set_property(GLOBAL PROPERTY PREDEFINED_TARGETS_FOLDER "")
endif()

# Define standard configurations
if( CMAKE_CONFIGURATION_TYPES AND NOT CMAKE_CONFIGURATION_TYPES MATCHES "Debug;Dev;Release" )
	list(APPEND Configs Debug Dev Release)
	set(CMAKE_CONFIGURATION_TYPES ${Configs} CACHE STRING "List of supported configurations." FORCE)
	set(CMAKE_INSTALL_PREFIX $ENV{SR_BIN_DIR} CACHE STRING "Default installation directory." FORCE)
	message(FATAL_ERROR "Default configuration was reset, please re-run CMake.")
endif()

# Initialize the development configuration using release configuration
set(CMAKE_C_FLAGS_DEV "${CMAKE_C_FLAGS_RELEASE}")
set(CMAKE_CXX_FLAGS_DEV "${CMAKE_CXX_FLAGS_RELEASE}")
set(CMAKE_STATIC_LINKER_FLAGS_DEV "${CMAKE_STATIC_LINKER_FLAGS_RELEASE}")
set(CMAKE_SHARED_LINKER_FLAGS_DEV "${CMAKE_SHARED_LINKER_FLAGS_RELEASE}")
set(CMAKE_MODULE_LINKER_FLAGS_DEV "${CMAKE_MODULE_LINKER_FLAGS_RELEASE}")
set(CMAKE_EXE_LINKER_FLAGS_DEV "${CMAKE_EXE_LINKER_FLAGS_RELEASE}")

# Setup QT
find_package(QT REQUIRED)

# MC3 files used by StingrayEditorInternal.dll C++/CLI
if( EDITOR_USE_MC3 )
	find_package(StingrayEditorInternal REQUIRED)
	install(FILES ${STINGRAY_EDITOR_INTERNAL_BINARIES} DESTINATION "${EDITOR_INSTALL_DIR}/backend")

	find_package(MC3 REQUIRED)
	install(FILES ${MC3_BINARIES} ${MC3_FIX_RESOURCES} DESTINATION "${EDITOR_INSTALL_DIR}/backend")
	install(FILES "${REPOSITORY_DIR}/internal/editor/backend/foundation/whitelist.xml" DESTINATION "${EDITOR_INSTALL_DIR}/backend")
endif()

if( PLATFORM_WINDOWS )
	add_compile_options(/MP)

	# Debug information linker flags
	add_compile_options(/Zi)
	add_exe_linker_flags(/DEBUG)

	# Treat all warnings as errors
	add_compile_options(/WX)

	# Enable full optimization in dev/release
	add_compile_options($<$<CONFIG:DEBUG>:/Od> $<$<NOT:$<CONFIG:DEBUG>>:/Ox>)
	add_compile_flags("/Oy /GL /Gy" dev release)
	add_exe_linker_flags("/LTCG /OPT:REF" dev release)

	# Inline function expansion
	add_compile_options(/Ob2)

	# Enable intrinsic functions in dev/release
	add_compile_options($<$<NOT:$<CONFIG:DEBUG>>:/Oi>)

	# Favor fast code
	add_compile_options(/Ot)

	# Enable fiber-safe optimizations in dev/release
	add_compile_options($<$<NOT:$<CONFIG:DEBUG>>:/GT>)

	# Enable string pooling
	add_compile_options(/GF)


	# Missing PDB files. We get this warning for freetype and zlib used by scaleform.
	#
	# Unfortunately, this linker warning cannot be ignored even though it is mostly
	# harmless and will occur frequently for third-party libraries. See
	#
	#     http://www.geoffchappell.com/studies/msvc/link/link/options/ignore.htm
	#
	# To be able to ignore this warning, you need to patch link.exe. We have a tool
	# for that:
	#
	#     tools/visual_studio_plugins/patch_linker.rb
	#
	add_linker_flags("/ignore:4099")
endif()
