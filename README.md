# Autodesk® Stingray / Stingray Plugin API samples

This repository contains sample engine runtime plugins included a copy of the engine runtime SDK files.

* **engine_plugins** Contains sample plugins with pre-generated Visual Studio 11 solution files. There are also batch files to re-generate the solution files if you have CMake installed. CMake is not required to use the samples.

* **editor_plugins** Contains editor standalone plugins that can be loaded using the plugin manager (look for `*.plugin` files).

* **stingray_sdk** Contains the header files to integrate with the engine runtime.

  * **editor_plugin_api** Contains the editor API headers use to access the editor native extension API that get exposed to JavaScript.
  * **engine_plugin_api** Contains the engine API headers use to access the engine runtime API.
  * **plugin_foundation** Contains helper C++ code such as Collections, Hashing and math utilities.
