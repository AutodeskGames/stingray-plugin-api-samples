cmake_minimum_required(VERSION 3.6)
project(level_utils)

add_typescript_project(${PROJECT_NAME} ${PROJECT_SOURCE_DIR} tsconfig.json)
add_dependencies(${PROJECT_NAME} stingray_editor_core)
set_target_properties(${PROJECT_NAME} PROPERTIES FOLDER "${EDITOR_PLUGINS_FOLDER_NAME}")
