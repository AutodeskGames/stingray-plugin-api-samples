# Samples

This folder contains all sample plugins for the Stingray editor and engine.

In addition, this folder contains batch files that you can use to re-generate the Visual Studio solution files for plugins that are written in C or C++.
In order to run these batch files, you'll need to have CMake installed.

*	**generate_all.bat** Re-generates the Visual Studio 2015 32-bit and 64-bit solutions for all the samples in this folder.

*	**generate_vc14.bat** Re-generates the Visual Studio 2015 32-bit and 64-bit solutions for a single plugin, which you specify by adding the name of folder that contains the plugin as a command line argument.

Note that you don't need CMake installed in order to build the plugins. You only need it if you want to re-generate the solutions.
