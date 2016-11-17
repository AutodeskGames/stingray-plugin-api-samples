@echo OFF

FOR /D %%G IN ("*") DO (
	echo Generating %%G
	call generate_vc14.bat %%G
)
