@echo OFF

FOR /D %%G IN ("*") DO (
	echo Generating %%G
	call generate_vc11.bat %%G
)
