#pragma once

#ifdef __cplusplus
extern "C" {
#endif

#include "config_data.h"

/*
	This file defines the Plugin API for the editor.

	The plugin interface is based around a single function:

		__declspec(dllexport) void *get_editor_plugin_api(unsigned plugin_api_id);

	The API ID is an integer that uniquely identify a specific version of a particular service.
	If the plugin can provide the service it returns a pointer to an API struct that contains
	function pointers for using the service.

	For ABI compatibility and simplicity, only C code is used in the interfaces.

	This method is used both by the plugins to provide services to the editor and by the editor
	to provide services to the plugins. For the second case, the editor sends a function:

		void *get_editor_api(unsigned api_id);

	To the plugins when they are initialized. The plugins can use this function to query for
	editor interfaces.

	If you need to make big changes to an API, so that it is no longer backwards compatible
	with the old API, you should create a new API_ID identifier and make sure that the old
	API_ID identifier still returns the old API. That way, the code will continue to work
	with older plugins that use the old API, while still providing new functionality in the
	new API.

	Note that during development, the APIs may change frequently. It is only when we lock an
	API down for public release that we need to be careful about version management and
	backwards compatibility.

	Note that all the functions in the APIs are not described in this header file, because in
	many cases they are just thin wrappers around existing editor systems.
*/

/* Plugin API_IDs for the different services that a plugin can implement. */
enum EditorPluginApiID
{
	EDITOR_PLUGIN_SYNC_API_ID = 0,
	EDITOR_PLUGIN_ASYNC_API_ID
};

/* Editor API_IDs for the different services the editor offers. */
enum EditorApiID {
	EDITOR_API_ID = 0,
	EDITOR_API_V2_ID,
	CONFIGDATA_API_ID,
	EDITOR_LOGGING_API_ID,
	EDITOR_EVAL_API_ID,
	EDITOR_ASYNC_API_ID
#if defined(_FUNCTIONAL_)
	, EDITOR_API_V3_ID
#endif
};

enum ProcessId
{
	BROWSER = 0,
	RENDERER
};

/* This function can be used by the plugin to query for editor API. */
typedef void *(*GetEditorApiFunction)(unsigned api);

/*
	This is the main interface provided by the plugins. The functions in this interface will
	be called at various points during the editor's setup and shutdown sequence.

	The plugin is not obligated to implement all these functions. You can return NULL for the
	functions that you do not support.
*/
struct EditorPluginSyncApi
{
	/* Called once the plugin has been loaded. */
	void (*plugin_loaded)(GetEditorApiFunction get_editor_api);

	/* Returns the name of the plugin. */
	const char *(*get_name)();

	/* Returns the version of the plugin. A version is a string of format 1.0.0.0 */
	const char *(*get_version)();

	/* Called when the plugins needs to be shutdown */
	void (*shutdown)(GetEditorApiFunction get_editor_api);
};

struct EditorPluginAsyncApi
{
	/* Called once the plugin has been loaded. */
	void (*plugin_loaded)(GetEditorApiFunction get_editor_api);

	/* Returns the name of the plugin. */
	const char *(*get_name)();

	/* Returns the version of the plugin. A version is a string of format 1.0.0.0 */
	const char *(*get_version)();

	/* Called when the plugins needs to be shutdown */
	void (*shutdown)(GetEditorApiFunction get_editor_api);
};

struct EditorApi
{
	typedef ConfigData* (*NativeFunctionHandler)(ConfigData **args, int num);

	/* Used to register a synchronous function that is executed on the render thread. Can be called using namespace.YOURFUNCTIONNAME(); */
	bool (*register_native_function)(const char *ns, const char *name, NativeFunctionHandler handler);

	/* Used to unregister a previously registered native function. */
	bool (*unregister_native_function)(const char *ns, const char *name);
};

struct EditorApi_V2
{
	typedef ConfigData* (*NativeFunctionHandler)(ConfigData **args, int num, GetEditorApiFunction get_editor_api);

	/* Used to register a synchronous function that is executed on the render thread. Can be called using namespace.YOURFUNCTIONNAME(); */
	bool (*register_native_function)(const char *ns, const char *name, NativeFunctionHandler handler);

	/* Used to unregister a previously registered native function. */
	bool (*unregister_native_function)(const char *ns, const char *name);
};

struct EditorAsyncApi
{
	typedef ConfigData* (*AsyncFunctionHandler)(ConfigData **args, int num, GetEditorApiFunction get_editor_api);

	/* Used to register an asynchronous function that is executed on the browser thread. Can be called using stingray.hostExecute('your-function-name', ...); */
	bool (*register_async_function)(const char *name, AsyncFunctionHandler handler);

	/* Used to unregister a previously registered async function. */
	bool (*unregister_async_function)(const char *name);

	/* Used to register an asynchronous function that is executed on the gui thread. Can be called using stingray.hostExecute('your-function-name', ...); */
	bool (*register_async_gui_function)(const char *name, AsyncFunctionHandler handler);

	/* Used to unregister a previously registered async gui function. */
	bool (*unregister_async_gui_function)(const char *name);
};

struct ConfigDataApi
{
	struct ConfigData *(*make)(cd_realloc realloc, void *ud, int config_size, int stringtable_size);
	void (*free)(struct ConfigData *cd);

	cd_loc (*root)(struct ConfigData *cd);
	int (*type)(struct ConfigData *cd, cd_loc loc);
	double (*to_number)(struct ConfigData *cd, cd_loc loc);
	const char *(*to_string)(struct ConfigData *cd, cd_loc loc);
	void *(*to_handle)(struct ConfigData *cd, cd_loc);
	cd_handle_dealloc (*to_handle_deallocator)(struct ConfigData *cd, cd_loc loc);

	int (*array_size)(struct ConfigData *cd, cd_loc arr);
	cd_loc (*array_item)(struct ConfigData *cd, cd_loc arr, int i);

	int (*object_size)(struct ConfigData *cd, cd_loc object);
	cd_loc (*object_keyloc)(struct ConfigData *cd, cd_loc object, int i);
	const char *(*object_key)(struct ConfigData *cd, cd_loc object, int i);
	cd_loc (*object_value)(struct ConfigData *cd, cd_loc object, int i);
	cd_loc (*object_lookup)(struct ConfigData *cd, cd_loc object, const char *key);

	cd_loc (*null)();
	cd_loc (*undefined)();
	cd_loc (*false_value)();
	cd_loc (*true_value)();
	cd_loc (*add_number)(struct ConfigData **cd, double n);
	cd_loc (*add_string)(struct ConfigData **cd, const char *s);
	cd_loc (*add_handle)(struct ConfigData **cd, void *handle, cd_handle_dealloc deallocator);
	cd_loc (*add_array)(struct ConfigData **cd, int size);
	cd_loc (*add_object)(struct ConfigData **cd, int size);
	void (*set_root)(struct ConfigData *cd, cd_loc root);

	void (*push)(struct ConfigData **cd, cd_loc array, cd_loc item);
	void (*set)(struct ConfigData **cd, cd_loc object, const char *key, cd_loc value);
	void (*set_loc)(struct ConfigData **cd, cd_loc object, cd_loc key, cd_loc value);

	cd_realloc (*allocator)(struct ConfigData *cd, void **user_data);
};

struct EditorLoggingApi
{
	/* Used to print only in the dev tools console. */
	void (*debug)(const char *message);

	/* Used to print an information in the stingray console. */
	void (*info)(const char *message);

	/* Used to print a warning in the stingray console. */
	void (*warning)(const char *message);

	/* Used to print an error in the stingray console. */
	void (*error)(const char *message);
};

struct EditorEvalApi
{
	/* Used to evaluate a javascript code in the global context. `return_value` and `exception` are optional.
	 * If an exception is thrown and `exception` is not null, it will be populated with an object
	 * {'message': exception_message}.
	 */
	bool (*eval)(const char *js_code, ConfigData *return_value, ConfigData *exception);
};

#ifdef __cplusplus
}
#endif


#if defined(__cplusplus) && defined(_FUNCTIONAL_)
struct EditorApi_V3
{
	typedef std::function<ConfigData*(ConfigData **, int)> NativeFunctionHandler;

	/* Used to register a synchronous function that is executed on the render thread. Can be called using namespace.YOURFUNCTIONNAME(); */
	bool (*register_native_function)(const char *ns, const char *name, NativeFunctionHandler handler);

	/* Used to unregister a previously registered native function. */
	bool (*unregister_native_function)(const char *ns, const char *name);
};
#endif
