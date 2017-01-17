@echo OFF

set GENERATE_ROOT_FOLDER=%~dp0
set GENERATE_ROOT_FOLDER = !GENERATE_ROOT_FOLDER!

pushd %GENERATE_ROOT_FOLDER%

FOR /D %%G IN ("*") DO (
	echo Generating %%G
	call generate_vc14.bat %%G
)

popd
