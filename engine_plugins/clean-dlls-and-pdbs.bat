@echo OFF

if "%~1"=="" (
	goto usage
)

if "%~2"=="" (
	goto usage
)

echo Cleaning up previous build of %2

setlocal enableExtensions enableDelayedExpansion

set plugin_output_folder=%1
set plugin_base_name=%2

set clean_time=%TIME::=_%
set clean_time=%clean_time:,=_%

set dll_plugin_path=%plugin_output_folder%%plugin_base_name%.dll
set pdb_plugin_path=%plugin_output_folder%%plugin_base_name%.pdb

set old_dll_plugin_name=%plugin_base_name%.dll.old
set old_pdb_plugin_name=%plugin_base_name%.%clean_time%.pdb.old

set old_dll_plugin_path=%plugin_output_folder%%old_dll_plugin_name%
set old_pdb_plugin_path=%plugin_output_folder%%old_pdb_plugin_name%
set old_pdb_plugin_wildcard=%plugin_output_folder%%plugin_base_name%.*.pdb.old

del %old_dll_plugin_path% >nul 2>nul
del %old_pdb_plugin_wildcard% >nul 2>nul

if exist %dll_plugin_path% (
	echo moving %dll_plugin_path% -> %old_dll_plugin_name%
	rename %dll_plugin_path% %old_dll_plugin_name%
)

if exist %pdb_plugin_path% (
	echo moving %pdb_plugin_path% -> %old_pdb_plugin_name%
	rename %pdb_plugin_path% %old_pdb_plugin_name%
)

del %old_dll_plugin_path% >nul 2>nul
del %old_pdb_plugin_wildcard% >nul 2>nul

goto end

:usage
    echo Usage: %~nn0 plugin_output_folder plugin_base_name
    goto :end
:end
