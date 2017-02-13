# Welcome to the Stingray sample plugins

The samples in this repository show how you can use the Stingray SDK to create plugins that:

-	extend the editor with new windows, tools and workflows.
-	extend the runtime game engine to change its behavior, and to add new script functions, flow nodes, and custom data types.
-	make new assets and resources available to all your Stingray projects.

## The SDK header files

This repository also contains a copy of all the header files that you need to use in order to integrate a C or C++ plugin into the editor or the engine.

-	`stingray_sdk/editor_plugin_api` Contains API headers that you can use to expose C-language functions from a plugin *.dll* to the editor's JavaScript environment.
-	`stingray_sdk/engine_plugin_api` Contains API headers that you can use to hook a plugin *.dll* up to the runtime engine.
-	`stingray_sdk/plugin_foundation` Contains optional helper C++ code that you can re-use in your plugins, such as collection classes, hashing functions and math utilities.

These same files are installed with each version of Stingray, under the `plugin_sdk` folder. They are copied here in order to simplify building the samples that depend on them.

## Building the plugins

All plugins that extend the runtime engine, and some that extend the editor, are written in C or C++. To try out any of these plugins, you'll have to use Visual Studio 2015 to compile the plugin code into a DLL.

You'll find a pre-generated Visual Studio solution in a subfolder under each plugin: *build/vc14/win32/* and *build/vc14/win64/*. Open the solution for your platform in Visual Studio and build.

Like the Stingray engine, the plug-in solutions have three different build configurations: Debug, Dev and Release. You'll probably want to use the Dev configuration for most uses, though you can use any plugin config alongside any engine config.
For more information on the difference between these configs, see [the help on building the engine](http://help.autodesk.com/view/Stingray/ENU/?guid=__source_access_building_build_modes_html).

## Online examples

##### [Stingshot](https://github.com/jschmidt42/stingshot) - Take screenshots inside Stingray Editor removing gizmos in current viewport.

## More resources

The [Stingray SDK Help](http://help-staging.autodesk.com/view/Stingray/ENU/?contextId=SDK_HOME) is a great companion while you're working on a new plugin.
It offers some background and conceptual information about creating plugins, and details about the ways your plugin can extend the Stingray environment.
