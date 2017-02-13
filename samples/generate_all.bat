@echo OFF

set GENERATE_ROOT_FOLDER=%~dp0
set GENERATE_ROOT_FOLDER = !GENERATE_ROOT_FOLDER!

rem pushd "%GENERATE_ROOT_FOLDER%"

setlocal enableExtensions enableDelayedExpansion

pushd %GENERATE_ROOT_FOLDER%

FOR /D %%G IN ("*") DO (
	if exist %%G\CMakeLists.txt (
		set project_name=%%G
		call :generate_plugin_solution
	)
)

popd

goto :end

:generate_plugin_solution
	setlocal enableExtensions enableDelayedExpansion

	echo Generating project for plugin "%project_name%"
	call %GENERATE_ROOT_FOLDER%generate_vc14.bat %project_name%
	echo,

	EXIT /B

:end
