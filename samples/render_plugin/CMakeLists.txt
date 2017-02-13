cmake_minimum_required(VERSION 3.6)

# Suppress CMake automatic regeneration, since we don't know if CMake is available
set(CMAKE_SUPPRESS_REGENERATION true)

set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} "${CMAKE_CURRENT_SOURCE_DIR}/../../cmake")
include(CMakeUtils)

get_filename_component(CURRENT_PROJECT_FOLDER_NAME "${CMAKE_CURRENT_SOURCE_DIR}" NAME)
project(${CURRENT_PROJECT_FOLDER_NAME})

# Define automatic namespace for C++
add_compile_options(-DPLUGIN_NAMESPACE=${PROJECT_NAME})

# Add project source files
find_source_files(ALL_SOURCE_FILES)
list(APPEND ALL_SOURCE_FILES "README.md")

# Include engine plugin sdk files
include_directories(${STINGRAY_SDK_SOURCE_PATH})
find_source_files(ALL_SOURCE_FILES ${STINGRAY_SDK_SOURCE_PATH}/engine_plugin_api)
find_source_files(ALL_SOURCE_FILES ${STINGRAY_SDK_SOURCE_PATH}/plugin_foundation)

# Optionally generate windows version resource
if (PLATFORM_WINDOWS)
	set(PRODUCT_NAME "Stingray")
	set(PRODUCT_COMPANY "Autodesk")
	set(PRODUCT_COPYRIGHT "Copyright (C) 2016 ${PRODUCT_COMPANY}, Inc. All rights reserved.")
	set(PRODUCT_VERSION_MAJOR "1")
	set(PRODUCT_VERSION_MINOR "7")
	set(PRODUCT_VERSION_REVISION "0")
	set(PRODUCT_VERSION_TCID "1")

	include_directories(${PROJECT_SOURCE_DIR})
	configure_file("${PROJECT_SOURCE_DIR}/${PROJECT_NAME}.rc.in" "${PROJECT_BINARY_DIR}/${PROJECT_NAME}.rc")
	set(RESOURCE_FILES "${PROJECT_BINARY_DIR}/${PROJECT_NAME}.rc")
	source_group("Resources" FILES ${RESOURCE_FILES})
	list(APPEND ALL_SOURCE_FILES ${RESOURCE_FILES})
endif()

# Setup shared library
add_library(${PROJECT_NAME} SHARED ${ALL_SOURCE_FILES})
set(TARGET_BASE_NAME "${PROJECT_NAME}${ENGINE_PLUGIN_SUFFIX}_$<LOWER_CASE:$<CONFIG>>")
set_target_properties(${PROJECT_NAME} PROPERTIES OUTPUT_NAME "${TARGET_BASE_NAME}")

add_dll_pdb_hotload_cleanup("${TARGET_BASE_NAME}")
