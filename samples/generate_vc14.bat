@echo OFF

if "%~1"=="" (
    echo Usage: %~nn0 plugin_folder
    goto :end
)

setlocal enableExtensions enableDelayedExpansion

set GENERATE_ROOT_FOLDER=%~dp0
set PLUGIN_FOLDER=%1

set ROOT=%GENERATE_ROOT_FOLDER%%PLUGIN_FOLDER%

REM Remove ending backslash from ROOT
set "win_root_path=!ROOT!"

REM Set up stingray SDK paths
set "RESOLVED_STINGRAY_SDK_PATH="
set "RESOLVED_STINGRAY_SDK_SOURCE_PATH_REPLACE="

if defined STINGRAY_SDK_SOURCE_PATH (
	echo Using specified stingray SDK path: %STINGRAY_SDK_SOURCE_PATH%
	REM Fully expand SDK path
	pushd "%STINGRAY_SDK_SOURCE_PATH%"
	set "RESOLVED_STINGRAY_SDK_PATH=!CD!"
	popd
	set "RESOLVED_STINGRAY_SDK_SOURCE_PATH_REPLACE=%STINGRAY_SDK_SOURCE_PATH%"
) else (
	echo Using default stingray SDK path
	REM Fully parent path
	pushd %GENERATE_ROOT_FOLDER%..\stingray_sdk
	set "RESOLVED_STINGRAY_SDK_PATH=!CD!"
	popd
	set "RESOLVED_STINGRAY_SDK_SOURCE_PATH_REPLACE=$(SolutionDir)..\..\..\..\..\stingray_sdk"
)

set "STINGRAY_SDK_SOURCE_PATH=!RESOLVED_STINGRAY_SDK_PATH!"
set "STINGRAY_SDK_SOURCE_PATH_REPLACE=!RESOLVED_STINGRAY_SDK_SOURCE_PATH_REPLACE!"

echo "Stingray SDK path: %STINGRAY_SDK_SOURCE_PATH%" 

REM CMake generators
set GENERATOR_VC14_WIN32="Visual Studio 14 2015"
set OUTPUT_VC14_WIN32="%ROOT%\build\vc14\win32"

set GENERATOR_VC14_WIN64="Visual Studio 14 2015 Win64"
set OUTPUT_VC14_WIN64="%ROOT%\build\vc14\win64"

REM Generate VC14 32bit
echo %GENERATOR_VC14_WIN32%...
pushd %ROOT%
if not exist %OUTPUT_VC14_WIN32% ( mkdir %OUTPUT_VC14_WIN32% )
if %errorlevel% neq 0 goto :failed
chdir %OUTPUT_VC14_WIN32%
if %errorlevel% neq 0 goto :failed
cmake -G %GENERATOR_VC14_WIN32% -DCMAKE_CONFIGURATION_TYPES="Debug;Dev;Release" -DENGINE_PLUGIN_SUFFIX="w32" -DPLATFORM_WINDOWS=TRUE -DGENERATED_FILES_DIR="build" ../../../
if %errorlevel% neq 0 goto :failed

call :replace_absolute_paths

REM Generate VC14 64bit
echo %GENERATOR_VC14_WIN64%...
if not exist %OUTPUT_VC14_WIN64% ( mkdir %OUTPUT_VC14_WIN64% )
if %errorlevel% neq 0 goto :failed
chdir %OUTPUT_VC14_WIN64%
if %errorlevel% neq 0 goto :failed
cmake -G %GENERATOR_VC14_WIN64% -DCMAKE_CONFIGURATION_TYPES="Debug;Dev;Release" -DENGINE_PLUGIN_SUFFIX="w64" -DPLATFORM_WINDOWS=TRUE -DGENERATED_FILES_DIR="build" ../../../
if %errorlevel% neq 0 goto :failed

call :replace_absolute_paths

popd
goto :end

:replace_absolute_paths
	SETLOCAL enableExtensions enableDelayedExpansion

	set "win_root_path_replace=$(SolutionDir)..\..\.."
	set "cmake_root_path_replace=$(SolutionDir)../../.."
	set "cmake_root_path=%win_root_path:\=/%"
	set "win_sdk_root_path=%STINGRAY_SDK_SOURCE_PATH%"

	for %%f in (*.vcxproj) do (
		set "textFile=%%f"
		set "search=%win_root_path%"
		set "replace=%win_root_path_replace%"
	    call :replace_in_file
		set "search=%cmake_root_path%"
		set "replace=%cmake_root_path_replace%"
	    call :replace_in_file
		set "search=%STINGRAY_SDK_SOURCE_PATH%"
		set "replace=%STINGRAY_SDK_SOURCE_PATH_REPLACE%"
	    call :replace_in_file
	)

	for %%f in (*.vcxproj.filters) do (
		set "textFile=%%f"
		set "search=%win_root_path%"
		set "replace=%win_root_path_replace%"
	    call :replace_in_file
		set "search=%cmake_root_path%"
		set "replace=%cmake_root_path_replace%"
	    call :replace_in_file
		set "search=%STINGRAY_SDK_SOURCE_PATH%"
		set "replace=%STINGRAY_SDK_SOURCE_PATH_REPLACE%"
	    call :replace_in_file
	)
    EXIT /B

:replace_in_file
    for /f "delims=" %%i in ('type "%textFile%" ^& break ^> "%textFile%" ') do (
        set "line=%%i"
        setlocal enabledelayedexpansion
        set "line=!line:%search%=%replace%!"
        >>"%textFile%" echo(!line!
        endlocal
    )
    EXIT /B


:failed
popd
echo ERROR: Generating projects failed.
exit /b 1

:end
