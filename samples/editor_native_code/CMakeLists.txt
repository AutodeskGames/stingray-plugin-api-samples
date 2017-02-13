cmake_minimum_required(VERSION 3.6)

# Suppress CMake automatic regeneration, since we don't know if CMake is available
set(CMAKE_SUPPRESS_REGENERATION true)

set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} "${CMAKE_CURRENT_SOURCE_DIR}/../../cmake")
include(CMakeEditorPlugin)

get_filename_component(CURRENT_PROJECT_FOLDER_NAME "${CMAKE_CURRENT_SOURCE_DIR}" NAME)
project(${CURRENT_PROJECT_FOLDER_NAME})

# Define automatic namespace for C++
add_compile_options(-DPLUGIN_NAMESPACE=${PROJECT_NAME})

# Add project source files
find_source_files(ALL_SOURCE_FILES)

if( PLATFORM_WINDOWS )
	add_linker_flags("/SUBSYSTEM:WINDOWS")
	add_linker_flags("/DEF:\"${PROJECT_SOURCE_DIR}/src/exports.def\"")
endif()

add_compile_options(-DPLUGIN_NAMESPACE=${PROJECT_NAME})

# Include engine plugin sdk files
include_directories(${STINGRAY_SDK_SOURCE_PATH})

# Setup shared library
source_group("Resources" FILES ${RESOURCE_FILES})
add_library(${PROJECT_NAME} SHARED ${ALL_SOURCE_FILES})
set_system_properties(${PROJECT_NAME})
set(TARGET_BASE_NAME "${PROJECT_NAME}_${ENGINE_PLUGIN_SUFFIX}_$<LOWER_CASE:$<CONFIG>>")
set_target_properties(${PROJECT_NAME} PROPERTIES OUTPUT_NAME "${TARGET_BASE_NAME}")
