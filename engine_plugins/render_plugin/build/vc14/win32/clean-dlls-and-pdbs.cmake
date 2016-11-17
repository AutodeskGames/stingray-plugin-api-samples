string(TIMESTAMP TimeStamp %y%m%d_%H%M%S)

set(Dirs Debug Dev Release)
foreach(Dir ${Dirs})
	file(GLOB Dlls "${Dir}/*.dll")
	foreach(Dll ${Dlls})
		execute_process(COMMAND ${CMAKE_COMMAND} -E rename "${Dll}" "${Dll}.old")
	endforeach(Dll)

	file(GLOB Pdbs "${Dir}/*.pdb")
	foreach(Pdb ${Pdbs})
		execute_process(COMMAND ${CMAKE_COMMAND} -E rename "${Pdb}" "${Pdb}.${TimeStamp}.old")
	endforeach(Pdb)

	file(GLOB Olds "${Dir}/*.old")
	foreach(Old ${Olds})
		execute_process(COMMAND ${CMAKE_COMMAND} -E remove ${Old} ERROR_QUIET)
	endforeach(Old)
endforeach(Dir)
