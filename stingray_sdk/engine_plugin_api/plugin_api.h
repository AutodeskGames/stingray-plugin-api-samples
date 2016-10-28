#pragma once

#include "plugin_api_types.h"
#include "plugin_c_api.h"

#ifdef __cplusplus
extern "C" {
#endif

#include <stdarg.h>
#include <stdint.h>

/*
	This file defines the Plugin API for the engine.

	The plugin interface is based around a single function:

		__declspec(dllexport) void *get_plugin_api(unsigned api_id);

	The API ID is an integer that uniquely identify a specific version of a particular service.
	If the plugin can provide the service it returns a pointer to an API struct that contains
	function pointers for using the service.

	For ABI compatibility and simplicity, only C code is used in the interfaces.

	This method is used both by the plugins to provide services to the engine and by the engine
	to provide services to the plugins. For the second case, the engine sends a function:

		void *get_engine_api(unsigned api_id);

	To the plugins when they are initialized. The plugins can use this function to query for
	engine interfaces.

	If you need to make big changes to an API, so that it is no longer backwards compatible
	with the old API, you should create a new API_ID identifier and make sure that the old
	API_ID identifier still returns the old API. That way, the code will continue to work
	with older plugins that use the old API, while still providing new functionality in the
	new API.

	Note that during development, the APIs may change frequently. It is only when we lock an
	API down for public release that we need to be careful about version management and
	backwards compatibility.

	Note that all the functions in the APIs are not described in this header file, because in
	many cases they are just thin wrappers around existing engine systems.
*/

#include <stddef.h>

/* API_IDs for the different services. */
enum PluginApiID {
	PLUGIN_API_ID =						0,
	LUA_API_ID =						1,
	DATA_COMPILER_API_ID =				2,
	DATA_COMPILE_PARAMETERS_API_ID =	3,
	ALLOCATOR_API_ID =					4,
	RESOURCE_MANAGER_API_ID =			5,
	LOGGING_API_ID =					6,
	UNIT_API_ID =						8,
	SCENE_GRAPH_API_ID =				9,
	FUTURE_INPUT_ARCHIVE_API_ID =		10,
	INPUT_ARCHIVE_API_ID =				11,
	APPLICATION_API_ID =				12,
	APPLICATION_OPTIONS_API_ID =		13,
	UNIT_REFERENCE_API_ID =				14,
	ERROR_CONTEXT_API_ID =				15,
	RENDER_INTERFACE_API_ID =			16,
	RAYCAST_API_ID =					17,
	RENDER_CALLBACKS_PLUGIN_API_ID =	18,
	RENDER_OVERRIDES_PLUGIN_API_ID =	19,
	FILESYSTEM_API_ID =					20,
	PLUGIN_MANAGER_API_ID =				21,
	WORLD_API_ID =						22,
	LINE_OBJECT_DRAWER_API_ID =			23,
	PROFILER_API_ID =					24,
	ERROR_API_ID =						25,
	RENDER_BUFFER_API_ID =				26,
	MESH_API_ID =						27,
	INPUT_BUFFER_API_ID =				28,
	RENDER_SCENE_GRAPH_API_ID =			29,
	SOUND_STREAM_SOURCE_API_ID =		30,
	C_API_ID =							31,
	THREAD_API_ID =						32,
	TIMER_API_ID =						33,
	MATERIAL_API_ID =					34,
	SCENE_DATABASE_API_ID =				35,
	STREAM_CAPTURE_API =				36,
	FLOW_NODES_API_ID =					37,
	CAMERA_API_ID =						38
};

/* ----------------------------------------------------------------------
	Common types
---------------------------------------------------------------------- */

/* These types are used in multiple plugins. */

struct AllocatorObject;
struct InputArchive;
struct InputBuffer;


/* ----------------------------------------------------------------------
	Plugin
---------------------------------------------------------------------- */

/* This function can be used by the plugin to query for engine APIs. */
typedef void *(*GetApiFunction)(unsigned api);

struct StateReflectionStream;

struct RD_DeviceData{
	struct Context *context;
	struct RenderTarget* render_target;
	struct DepthStencilTarget* depth_stencil_target;
};

struct RD_EngineData{
	void* render_env;
	void* render_target;
	void* depth_stencil_target;
};

struct RenderDevicePluginArguments {
	struct RD_DeviceData device_data;
	struct RD_EngineData engine_data;
};


/*
	This is the main interface provided by the plugins. The functions in this interface will
	be called at various points during the engine's setup and shutdown sequence.

	The plugin is not obligated to implement all these functions. You can return NULL for the
	functions that you do not support.
*/
struct PluginApi
{
	/* Called once plugins have been loaded. */
	void (*plugins_loaded)(GetApiFunction get_engine_api);

	/* Called when the engine sets up the DataCompiler. You can use the functions in the DataCompiler
	   API to add custom data types to the DataCompiler. */
	void (*setup_data_compiler)(GetApiFunction get_engine_api);

	/* Called when the engine shuts down the data compiler. */
	void (*shutdown_data_compiler)();

	/* Called when the engine sets up the ResourceManager. At this point you can use the ResourceManager
	   API to add support for resource manager loading of your custom data types. */
	void (*setup_resources)(GetApiFunction get_engine_api);

	/* Called when the engine shuts down the ResourceManager. */
	void (*shutdown_resources)();

	/* Called when the engine reloads its resources, to see if the plugin handles the given resource */
	int (*can_refresh)(uint64_t type);

	/* Called when the engine reloads its resources, to tell the plugin to refresh the given resource */
	void (*refresh)(uint64_t type, uint64_t name);

	/* Called when the engine sets up the game. At this point, you can use the functions in the LuaApi
	   to add functions to the engine's Lua API. */
	void (*setup_game)(GetApiFunction get_engine_api);

	/* Called per game frame. */
	void (*update_game)(float dt);

	/* Called when the engine shuts down the game. */
	void (*shutdown_game)();

	/* Called when a world has been deleted by the application. */
	void (*unregister_world)(CApiWorld * world);

	/* Called when a world is added to the application by the game. */
	void (*register_world)(CApiWorld * world);

	/* Called when units added to the application by the game. */
	void (*units_spawned)(CApiUnit **units, unsigned count);

	/* Called when units deleted by the application. */
	void (*units_unspawned)(CApiUnit **units, unsigned count);

	/* Return the murmur 32 hash of a name string provided by the plugin.
	   The name should match any usage in config files, e.g., the name passed to a plugin modifier in render_config.
	   If a hash is provided it will be possible to access the plugin within the core. */
	unsigned (*get_id)();

	/* Returns the name of the plugin. Called by plugin_manager::plugin_name(). */
	const char *(*get_name)();

	/* Functions to be called to schedule "device poking" rendering commands */
	/* TODO: Better naming needed. */
	void* (*get_render_env)();
	void (*render)(struct RenderDevicePluginArguments *arguments);

	/* Called by the engine when something outside of the plugin wants to use the
	   plugin's native services. If the plugin supports a native library api then it
	   should provide a plugin_library_api.h header which contains the plugin
	   identification and interface. The id information is needed to search for this
	   plugin and the interface is needed to use the returned structure. */
	void* (*get_library_api)();

	void (*debug_draw)(CApiWorld * world, struct StateReflectionStream * srs);

	/* Called at the start of a "hot reload" of the plugin DLL. Should return a
	   pointer to a serialized "state" for the plugin.*/
	void *(*start_reload)(GetApiFunction get_engine_api);

	/* Called to finalized the "hot reload" after the plugin has been reloaded with
	   the new code. Should restore the state from the serialized state data. Note
	   that it is the responsibility of the plugin to free the state data. */
	void(*finish_reload)(GetApiFunction get_engine_api, void *state);

	void (*finish_delay_load)(GetApiFunction get_engine_api);

	void *reserved[32];
};

/*
	This is the interface implemented by plugins who are interested in callbacks from the rendering thread.

	If not explicitly stated using the prefix "prepare_" in the function name the callback is triggered right before
	the engine exits the scope of the function.

	The plugin is not obligated to implement all these functions. You can return NULL for the
	functions that you do not support.
*/
struct RenderCallbacksPluginApi
{
	/* Callbacks during swapchain creation / resize / destroy */
	void (*create_swap_chain)(unsigned swap_chain_handle, unsigned width, unsigned height);
	void (*prepare_resize_swap_chain)(unsigned swap_chain_handle, unsigned width, unsigned height);
	void (*resize_swap_chain)(unsigned swap_chain_handle, unsigned width, unsigned height);
	void (*destroy_swap_chain)(unsigned swap_chain_handle);

	/* Called during the rendering of a frame */
	void (*begin_frame)();
	void (*end_frame)();
};

/*
	This is the interface implemented by plugins who are interested in overriding certain functionallity
	on the rendering thread.

	The plugin is not obligated to implement all these functions. You can return NULL for the
	functions that you do not support.

	TODO: how to best deal with multiple plugins overriding the same function?
*/

/*
	When overriding present(), if you still want the default to be executed return 0 otherwise return 1
*/
struct RenderOverridesPluginApi
{
	int (*present)(unsigned swap_chain_handle);
};

/* ----------------------------------------------------------------------
	Lua
---------------------------------------------------------------------- */

typedef struct lua_State lua_State;
typedef int (*lua_CFunction) (lua_State *L);
typedef struct lua_Debug lua_Debug;
typedef double lua_Number;
typedef ptrdiff_t lua_Integer;

typedef void (*lua_Hook) (lua_State *L, lua_Debug *ar);
typedef const char * (*lua_Reader) (lua_State *L, void *ud, size_t *sz);
typedef int (*lua_Writer) (lua_State *L, const void* p, size_t sz, void* ud);
typedef void * (*lua_Alloc) (void *ud, void *ptr, size_t osize, size_t nsize);

typedef struct luaL_Reg luaL_Reg;

/* Interface to access Lua services.

	The functions in this interface correspond to those defined in the LuaEnvironment class,
	LuaStack class and the Lua API. See those classes for documentation. */
struct LuaApi
{
	/* LuaEnvironment functions */
	void (*add_module_function)(const char *module, const char *name, lua_CFunction f);
	void (*deprecated_warning)(const char *module, const char *name, lua_CFunction f, const char* message);
	void (*deprecated_error)(const char *module, const char *name, const char* message);
	void (*set_module_bool)(const char *module, const char *key, int value);
	void (*set_module_number)(const char *module, const char *key, double value);
	void (*set_module_namespace_number)(const char *module, const char* ns, const char *key, double value);
	void (*set_module_string)(const char *module, const char *key, const char *value);

	/* Console commands. These do nothing in release builds. */
	void (*add_console_command)(const char *command, lua_CFunction f, const char *desc, ...);

	/* state manipulation */
	void		  (*close)     (lua_State *L);
	lua_State	 *(*newthread) (lua_State *L);
	lua_CFunction (*atpanic)   (lua_State *L, lua_CFunction panicf);

	/* Basic stack manipulation */
	int   (*gettop) (lua_State *L);
	void  (*settop) (lua_State *L, int idx);
	void  (*pushvalue) (lua_State *L, int idx);
	void  (*remove) (lua_State *L, int idx);
	void  (*insert) (lua_State *L, int idx);
	void  (*replace) (lua_State *L, int idx);
	int   (*checkstack) (lua_State *L, int sz);
	void  (*xmove) (lua_State *from, lua_State *to, int n);

	/* Access functions */
	int             (*isnumber) (lua_State *L, int idx);
	int             (*isstring) (lua_State *L, int idx);
	int             (*iscfunction) (lua_State *L, int idx);
	int             (*isuserdata) (lua_State *L, int idx);
	int             (*type) (lua_State *L, int idx);
	const char     *(*lua_typename) (lua_State *L, int tp);

	int            (*equal) (lua_State *L, int idx1, int idx2);
	int            (*rawequal) (lua_State *L, int idx1, int idx2);
	int            (*lessthan) (lua_State *L, int idx1, int idx2);

	lua_Number		(*tonumber) (lua_State *L, int idx);
	lua_Integer  	(*tointeger) (lua_State *L, int idx);
	int             (*toboolean) (lua_State *L, int idx);
	const char     *(*tolstring) (lua_State *L, int idx, size_t *len);
	size_t          (*objlen) (lua_State *L, int idx);
	lua_CFunction   (*tocfunction) (lua_State *L, int idx);
	void	       *(*touserdata) (lua_State *L, int idx);
	lua_State      *(*tothread) (lua_State *L, int idx);
	const void     *(*topointer) (lua_State *L, int idx);

	/* Push functions */
	void  (*pushnil) (lua_State *L);
	void  (*pushnumber) (lua_State *L, lua_Number n);
	void  (*pushinteger) (lua_State *L, lua_Integer n);
	void  (*pushlstring) (lua_State *L, const char *s, size_t l);
	void  (*pushstring) (lua_State *L, const char *s);
	const char *(*pushvfstring) (lua_State *L, const char *fmt, va_list argp);
	const char *(*pushfstring) (lua_State *L, const char *fmt, ...);
	void  (*pushcclosure) (lua_State *L, lua_CFunction fn, int n);
	void  (*pushboolean) (lua_State *L, int b);
	void  (*pushlightuserdata) (lua_State *L, void *p);
	int   (*pushthread) (lua_State *L);

	/* Get functions */
	void  (*gettable) (lua_State *L, int idx);
	void  (*getfield) (lua_State *L, int idx, const char *k);
	void  (*rawget) (lua_State *L, int idx);
	void  (*rawgeti) (lua_State *L, int idx, int n);
	void  (*createtable) (lua_State *L, int narr, int nrec);
	void *(*newuserdata) (lua_State *L, size_t sz);
	int   (*getmetatable) (lua_State *L, int objindex);
	void  (*getfenv) (lua_State *L, int idx);

	/* Set functions */
	void  (*settable) (lua_State *L, int idx);
	void  (*setfield) (lua_State *L, int idx, const char *k);
	void  (*rawset) (lua_State *L, int idx);
	void  (*rawseti) (lua_State *L, int idx, int n);
	int   (*setmetatable) (lua_State *L, int objindex);
	int   (*setfenv) (lua_State *L, int idx);

	/* Load and call functions */
	void  (*call) (lua_State *L, int nargs, int nresults);
	int   (*pcall) (lua_State *L, int nargs, int nresults, int errfunc);
	int   (*cpcall) (lua_State *L, lua_CFunction func, void *ud);
	int   (*load) (lua_State *L, lua_Reader reader, void *dt, const char *chunkname);
	int   (*dump) (lua_State *L, lua_Writer writer, void *data);

	/* Coroutine functions */
	int  (*yield) (lua_State *L, int nresults);
	int  (*resume) (lua_State *L, int narg);
	int  (*status) (lua_State *L);

	/* Garbage collection */
	int (*gc) (lua_State *L, int what, int data);

	/* Miscellaneous functions */
	int   (*error) (lua_State *L);
	int   (*next) (lua_State *L, int idx);
	void  (*concat) (lua_State *L, int n);

	/* Debugging */
	int (*getstack) (lua_State *L, int level, lua_Debug *ar);
	int (*getinfo) (lua_State *L, const char *what, lua_Debug *ar);
	const char *(*getlocal) (lua_State *L, const lua_Debug *ar, int n);
	const char *(*setlocal) (lua_State *L, const lua_Debug *ar, int n);
	const char *(*getupvalue) (lua_State *L, int funcindex, int n);
	const char *(*setupvalue) (lua_State *L, int funcindex, int n);

	int (*sethook) (lua_State *L, lua_Hook func, int mask, int count);
	lua_Hook (*gethook) (lua_State *L);
	int (*gethookmask) (lua_State *L);
	int (*gethookcount) (lua_State *L);

	/* Library functions */
	void (*lib_openlib) (lua_State *L, const char *libname, const luaL_Reg *l, int nup);
	void (*lib_register) (lua_State *L, const char *libname, const luaL_Reg *l);
	int	 (*lib_getmetafield) (lua_State *L, int obj, const char *e);
	int	 (*lib_callmeta) (lua_State *L, int obj, const char *e);
	int (*lib_typerror) (lua_State *L, int narg, const char *tname);
	int	 (*lib_argerror) (lua_State *L, int numarg, const char *extramsg);
	const char	*(*lib_checklstring) (lua_State *L, int numArg, size_t *l);
	const char	*(*lib_optlstring) (lua_State *L, int numArg, const char *def, size_t *l);
	lua_Number	 (*lib_checknumber) (lua_State *L, int numArg);
	lua_Number	 (*lib_optnumber) (lua_State *L, int nArg, lua_Number def);
	lua_Integer	 (*lib_checkinteger) (lua_State *L, int numArg);
	lua_Integer	 (*lib_optinteger) (lua_State *L, int nArg, lua_Integer def);
	void (*lib_checkstack) (lua_State *L, int sz, const char *msg);
	void (*lib_checktype) (lua_State *L, int narg, int t);
	void (*lib_checkany) (lua_State *L, int narg);
	int	 (*lib_newmetatable) (lua_State *L, const char *tname);
	void*(*lib_checkudata) (lua_State *L, int ud, const char *tname);
	void (*lib_where) (lua_State *L, int lvl);
	int (*lib_error) (lua_State *L, const char *fmt, ...);
	int	 (*lib_checkoption) (lua_State *L, int narg, const char *def, const char *const lst[]);
	int	 (*lib_ref) (lua_State *L, int t);
	void (*lib_unref) (lua_State *L, int t, int ref);
	int	 (*lib_loadfile) (lua_State *L, const char *filename);
	int (*lib_loadbuffer) (lua_State *L, const char *buff, size_t sz, const char *name);
	int (*lib_loadstring) (lua_State *L, const char *s);
	lua_State *(*lib_newstate) (void);
	const char *(*lib_gsub) (lua_State *L, const char *s, const char *p, const char *r);
	const char *(*lib_findtable) (lua_State *L, int idx, const char *fname, int szhint);
	void (*lib_openlibs)(lua_State *L);

	/* Custom functions */

	int (*getindex) (lua_State *L, int idx);
	void (*pushindex) (lua_State *L, int n);

	int (*getindex_0_or_1_based) (lua_State *L, int idx);
	void (*pushindex_0_or_1_based) (lua_State *L, int n);

	void  (*pushvector2) (lua_State *L, float v[2]);
	void  (*pushvector3) (lua_State *L, float v[3]);
	void  (*pushvector4) (lua_State *L, float v[4]);
	void  (*pushquaternion) (lua_State *L, float q[4]);
	void  (*pushmatrix4x4) (lua_State *L, float m[16]);

	float * (*getvector2) (lua_State *L, int i);
	float * (*getvector3) (lua_State *L, int i);
	float * (*getvector4) (lua_State *L, int i);
	float * (*getquaternion) (lua_State *L, int i);
	float * (*getmatrix4x4) (lua_State *L, int i);

	CApiUnit * (*getunit) (lua_State *L, int i);

	lua_State* (*getscriptenvironmentstate)();

	int (*istable) (lua_State *L, int i);
	int (*isvector2) (lua_State *L, int i);
	int (*isvector3) (lua_State *L, int i);
	int (*isvector4) (lua_State *L, int i);
	int (*ismatrix4x4) (lua_State *L, int i);

	void (*pop) (lua_State *L);

	int (*is_unit_reference) (lua_State *L, int i);
};

/* ----------------------------------------------------------------------
	DataCompiler
---------------------------------------------------------------------- */

/* Represents a buffer of data. */
struct Buffer
{
	char *p;
	unsigned len;
};

/* Represents the result of a data compile operation. Corresponds to the same object in the
	stingray namespace. */
struct DataCompileResult
{
	struct Buffer data;
	struct Buffer stream;
	const char *error;
};

/* Corresponds to stingray::DataCompileParameters */
struct DataCompileParameters;

/* Function type for compiling data. */
typedef struct DataCompileResult (*CompileFunction)(struct DataCompileParameters *data_compile_params);

/* Function type for raw compiling data. */
typedef struct DataCompileResult (*RawCompileFunction)(const char *input, struct AllocatorObject *allocator);

/* Function type for compiling additional package include data. */
typedef const char * (*PackageIncludeCompileFunction)(struct DataCompileParameters *data_compile_params);

enum SourceTextureReadResult_ResultType {
	DC_STRR_RT_IMAGE2D,
	DC_STRR_RT_IMAGE3D,
	DC_STRR_RT_IMAGECUBE,
	DC_STRR_RT_UNKNOWN
};

enum SourceTextureReadResult_ResultPixelFormat {
	DC_STRR_RPF_R8G8B8A8,
	DC_STRR_RPF_NUM_FORMATS,
	DC_STRR_RPF_UNKNOWN
};

/* Represents result of source image read operation. */
struct SourceTextureReadResult {
	unsigned version;
	unsigned width;
	unsigned height;
	enum SourceTextureReadResult_ResultPixelFormat pixel_format;
	enum SourceTextureReadResult_ResultType image_type;
	struct Buffer data;
	const char *error;
};

/* Function type for reading source texture. */
typedef struct SourceTextureReadResult (*SourceTextureReadFunction)(const char *type, const void *data, unsigned len, struct AllocatorObject *allocator);

/* Interface to access stingray::DataCompiler. */
struct DataCompilerApi
{
	void (*add_compiler)(const char *type, unsigned version, CompileFunction compile);
	void (*add_closed_platform_compiler)(const char *platform, const char *type, RawCompileFunction compile);
	void (*add_extra_package_include_compiler)(const char *type, int id, int version, PackageIncludeCompileFunction compile);
	void (*add_texture_reader)(const char *type, SourceTextureReadFunction read);
	void (*set_uses_fbx)(const char *type);
};

/* ----------------------------------------------------------------------
	DataCompileParameters
---------------------------------------------------------------------- */

/* Interface to access stingray::DataCompileParameters. */
struct DataCompileParametersApi
{
	const char * (*source_path)(struct DataCompileParameters *input);
	const char * (*name)(struct DataCompileParameters *input);

	/* Gets the string name of the destination platform that the data will be viewed on. */
	const char * (*destination_platform)(struct DataCompileParameters *input);

	/* Parses the input data as a SJSON file and returns a buffer describing the data.
	   The buffer uses the ConstConfig format and can be interpreted using the functions
	   in the stingray::ConstConfigItem interface. */
	struct DataCompileResult (*parse)(struct DataCompileParameters *input);

	/* */
	struct DataCompileResult(*read)(struct DataCompileParameters *input);

	/* */
	struct DataCompileResult(*read_bundle)(struct DataCompileParameters *input);

	struct AllocatorObject *(*allocator)(struct DataCompileParameters *input);

	/* Includes (type,name) in packages for the compiled file. */
	void (*include_in_package)(struct DataCompileParameters *input, const char *type, const char *name);

	void (*glob_include_in_package)(struct DataCompileParameters *input, const char *prefix, const char *suffix, const char *type);

	/* Returns true if the path exists. */
	int (*exists)(struct DataCompileParameters *input, const char *path);
};

/* ----------------------------------------------------------------------
	Allocator
---------------------------------------------------------------------- */

/* Interface to access stingray::Allocator. */
struct AllocatorApi
{
	struct AllocatorObject *(*make_plugin_allocator)(const char *plugin_name);
	void (*destroy_plugin_allocator)(struct AllocatorObject *);

	struct AllocatorObject *(*make_plugin_physical_allocator)(const char *plugin_name);

	struct AllocatorObject *(*make_temp_allocator)();
	void (*destroy_temp_allocator)(struct AllocatorObject *);

	void *(*allocate)(struct AllocatorObject *allocator, size_t size, unsigned align);
	size_t (*deallocate)(struct AllocatorObject *allocator, void *p);
	size_t (*allocated_size)(struct AllocatorObject *allocator, void *p);
};

/* ----------------------------------------------------------------------
	ResourceManager
---------------------------------------------------------------------- */

struct FutureInputArchive;
typedef uint64_t ResourceID;

struct RenderResourceContext;
struct ResourceManager;

struct RM_ResourceTypeCallbacks {
	void * user_data;

	void *(*load) (void *obj, ResourceID name, struct InputArchive *archive, struct AllocatorObject *allocator, struct RenderResourceContext *rrc);
	void (*destroy) (void *obj, void *resource, struct AllocatorObject *allocator, struct RenderResourceContext *rrc);
	void (*bring_in) (void *obj, void *resource);
	void (*bring_out) (void *obj, void *resource);
	void (*lookup) (void *obj, void *p, struct ResourceManager *resource_manager);

	struct AllocatorObject *allocator;
	unsigned int align;
};

/* Interface to access stingray::ResourceManager. */
struct ResourceManagerApi
{
	unsigned int (*version)();

	/* Allocates an Array<uint64_t> and returns pointer. caller owns result. */
	void * (*loaded_resources)(struct AllocatorApi * allocator, struct AllocatorObject *allocator_object, const uint64_t type_id);

	void (*register_type)(const char *type);
	void (*register_type_with_callbacks)(const char *type, struct RM_ResourceTypeCallbacks * data);
	int (*can_get)(const char *type, const char *name);
	int (*can_get_by_id)(uint64_t type_id, uint64_t name_id);
	void *(*get)(const char *type, const char *name);
	void *(*get_by_id)(uint64_t type_id, uint64_t name_id);

	/* Returns an allocated FutureInputArchive, caller owns the object.
	   TODO: Revisit this pattern. */
	struct FutureInputArchive * (*new_open_stream)(struct AllocatorApi * allocator, struct AllocatorObject * allocator_object, const char * type, const char * name);
	struct FutureInputArchive * (*new_open_stream_by_id)(struct AllocatorApi * allocator, struct AllocatorObject * allocator_object, uint64_t type_id, uint64_t name_id);
	void (*delete_stream)(struct FutureInputArchive * fia, struct AllocatorApi * allocator, struct AllocatorObject * allocator_object);
};

/* ----------------------------------------------------------------------
	FutureInputArchive
---------------------------------------------------------------------- */

/* Interface to access stingray::FutureInputArchive. */
struct FutureInputArchiveApi
{
	void (*set_offset)(struct FutureInputArchive * fia, unsigned offset, unsigned size);
	unsigned (*size)(struct FutureInputArchive * fia);
	int (*ready)(struct FutureInputArchive * fia);
	void (*wait)(struct FutureInputArchive * fia);

	/* Returns an allocated InputArchive, caller must call delete_archive when finished.*/
	struct InputArchive * (*new_archive)(struct FutureInputArchive * fia, struct AllocatorApi * allocator, struct AllocatorObject * allocator_object);

	void (*cancel)(struct FutureInputArchive * fia);

	// cancel or new_archive must be called before deleting
	void (*delete_archive)(struct InputArchive * fia, struct AllocatorApi * allocator, struct AllocatorObject * allocator_object);
};

/* ----------------------------------------------------------------------
	InputArchive
---------------------------------------------------------------------- */

/* Interface to access stingray::InputArchive. */
struct InputArchiveApi
{
	void (*read)(struct InputArchive * input_archive, void *buffer, unsigned size);
	void (*set_position)(struct InputArchive * input_archive, int64_t position);
	int64_t (*size)(struct InputArchive * input_archive);
	struct InputBuffer * (*buffer)(struct InputArchive * input_archive);
};

/* ----------------------------------------------------------------------
	InputBuffer
---------------------------------------------------------------------- */

struct InputBufferApi
{
	int64_t (*size)(struct InputBuffer * input_buffer);
	unsigned (*available)(struct InputBuffer * input_buffer);
	void (*consume)(struct InputBuffer * input_buffer, unsigned bytes);
	void (*ensure)(struct InputBuffer * input_buffer, unsigned bytes);
	void * (*ptr)(struct InputBuffer * input_buffer);
	int64_t (*position)(struct InputBuffer * input_buffer);
	void (*set_position)(struct InputBuffer * input_buffer, int64_t offset);
	void (*set_read_chunk)(struct InputBuffer * input_buffer, unsigned size);
	void (*flush)(struct InputBuffer * input_buffer, unsigned bytes);
	int (*can_flush_without_stalling)(struct InputBuffer * input_buffer);
};

/* ----------------------------------------------------------------------
	Logging
---------------------------------------------------------------------- */

/* Interface to access stingray::Logging. */
struct LoggingApi
{
	void (*info)(const char *system, const char *info);
	void (*warning)(const char *system, const char *warning);
	void (*error)(const char *system, const char *error);
};

/* ----------------------------------------------------------------------
	RendererInterface
---------------------------------------------------------------------- */

/* ID3D11Device on D3D platforms */
struct RI_Device;

enum RI_ResourceType { RI_RESOURCE_TEXTURE, RI_RESOURCE_RENDER_TARGET, RI_RESOURCE_NOT_INITIALIZED = -1 };

struct RenderResource {
	unsigned type;
	unsigned handle;
};

typedef void (*RenderUserCallback)(void *user_data);

#if defined(WINDOWSPC) || defined(XBOXONE)
	struct ID3D11RenderTargetView;
	struct ID3D11ShaderResourceView;
	struct ID3D11Texture2D;
	struct IDXGISwapChain;

	struct RI_PlatformTexture2d
	{
		struct ID3D11Texture2D          *texture;
		struct ID3D11ShaderResourceView *resource_view;
		struct ID3D11ShaderResourceView *resource_view_srgb;
	};

	struct RI_PlatformRenderTarget
	{
		struct ID3D11RenderTargetView *render_target_view;
	};

	struct RI_PlatformSwapChain
	{
		struct IDXGISwapChain *dxgi_swap_chain;
	};

	struct RI_PlatformWindow
	{
		void *window;
	};
#else
	/* TODO: Implement RT for other platforms. */
	struct RI_PlatformRenderTarget { char unused; };

	#if defined(ANDROID)
		/* cf. gl::Context */
		struct RI_Device {
			void* context; /* EGLContext */
			void* display; /* EGLDisplay */
			void* surface; /* EGLSurface */
			void* config;  /* EGLConfig */
		};
	#endif

	#if defined(MACOSX) || defined(IOS) || defined(ANDROID) || defined(WEBGL) || defined(LINUXPC)
		struct RI_PlatformTexture2d    {
			unsigned int handle; /* binding handle */
			unsigned int format; /* internal pixel format, e.g., GL_DEPTH24_STENCIL8, GL_R16F */
			unsigned int type;   /* channel type info, e.g., GL_UNSIGNED_INT_24_8, GL_UNSIGNED_BYTE */
			unsigned int width;
			unsigned int height;
			unsigned int size;   /* size in bytes used by the texture */
		};
	#else
		/* TODO: Implement Texture2D for other platforms. */
		struct RI_PlatformTexture2d { char unused; };
	#endif

	/* TODO: Implement SwapChain and Window for other platforms. */
	struct RI_PlatformSwapChain    { char unused; };
	struct RI_PlatformWindow       { char unused; };
#endif


struct RenderInterfaceApi
{
	int (*create_fence)();
	void (*wait_for_fence)(int);
	void (*run_callback)(void(*callback)(void* data), void* user_data, uint32_t user_data_size);
	struct RI_Device* (*device)();
	struct RenderResource* (*global_render_resource)(const char *name);
	struct RI_PlatformTexture2d (*texture_2d)(struct RenderResource *render_resource);
	/* On GL platforms this returns an empty swap chain, but swaps buffers on the given chain handle */
	struct RI_PlatformSwapChain (*swap_chain)(unsigned handle);
	struct RI_PlatformRenderTarget (*render_target)(unsigned handle, int layer, int mip_level);
	struct RI_PlatformWindow (*window)(unsigned handle);
};

/* ----------------------------------------------------------------------
	Unit
---------------------------------------------------------------------- */

enum U_ActorType {
	U_ACTOR_SPHERE =		0,
	U_ACTOR_PLANE =			1,
	U_ACTOR_CAPSULE =		2,
	U_ACTOR_BOX =			3,
	U_ACTOR_CONVEXMESH =	4,
	U_ACTOR_TRIANGLEMESH =	5,
	U_ACTOR_HEIGHTFIELD =	6
};

struct CollisionFilter;

struct U_TriangleMesh
{
	const char *indices;
	unsigned num_triangles;
	unsigned index_stride;
	const char *vertices;
	unsigned vertex_stride;
	float transform[16];
};

struct U_ConvexMesh
{
	const char *indices;
	unsigned num_polygons;
	unsigned index_stride;
	const char *vertices;
	unsigned vertex_stride;
	float transform[16];
};

struct U_HeightField
{
	unsigned num_rows;
	unsigned num_columns;
	float    row_scale;
	float    column_scale;
};

struct U_Sphere
{
	float transform[16];
	float radius;
};

struct U_Capsule
{
	float transform[16];
	float radius;
	float half_height;
};

struct U_Box
{
	float transform[16];
	float half_extents[3];
};

struct U_HeightFieldPos
{
	float pos[3];
};

/* Corresponds to engine SceneGraph type */
struct SceneGraph;

struct UnitApi
{
	struct SceneGraph * (*scene_graph)(CApiUnit *unit);
	CApiUnitRef (*reference)(CApiUnit * unitobject);

	int(*num_meshes)(CApiUnit *unit);
	void(*mesh)(CApiUnit *unit, int mesh_index, struct U_TriangleMesh *mesh);
	uint32_t(*mesh_name)(CApiUnit *unit, int mesh_index);
	int(*mesh_node)(CApiUnit *unit, int mesh_index);

	int(*num_actors)(CApiUnit *unit);
	CApiActor*(*actor)(CApiUnit *unit, int index);

	int(*is_collision_enabled)(CApiActor *ao);
	int(*is_static)(CApiActor *ao);
	int(*is_kinematic)(CApiActor * ao);
	int(*num_shapes)(CApiActor* ao);
	int(*shape_type)(CApiActor *ao, int shape_index);

	int(*sphere)(CApiActor *ao, int shape_index, struct U_Sphere *so);
	int(*capsule)(CApiActor *ao, int shape_index, struct U_Capsule *co);
	int(*box)(CApiActor *ao, int shape_index, struct U_Box *bo);
	int(*triangle_mesh)(CApiActor *ao, int shape_index, struct U_TriangleMesh *mesh);

	int(*convex_mesh)(CApiActor *ao, int shape_index, struct U_ConvexMesh *convexmesh);
	int(*convex_mesh_polygon_num_vertices)(CApiActor *ao, int shape_index, int polygon_index);
	int(*convex_mesh_polygon_base_index)(CApiActor *ao, int shape_index, int polygon_index);

	int(*height_field)(CApiActor *ao, int shape_index, struct U_HeightField *heightfield);
	int(*heightfield_position)(CApiActor *ao, int shape_index, float x, float y, struct U_HeightFieldPos *pos);

	CApiMover*(*mover)(CApiUnit *unit);
	struct CollisionFilter*(*collision_filter)(CApiMover *mo);

	uint64_t (*unit_resource_name)(CApiUnit *unit);

	uint8_t (*get_curve_value)(CApiUnit *unit, uint32_t object, uint32_t parameter, unsigned count, float* floats);
	CApiWorld*(*world)(CApiUnit *unit);
};

struct UnitReferenceApi
{
	CApiUnit * (*dereference)(CApiUnitRef ref);
};

/* ----------------------------------------------------------------------
	SceneGraph
---------------------------------------------------------------------- */

/* Corresponds to engine SceneFlags type */
struct SceneFlags;

struct SceneGraphApi
{
	/* Returns 16 floats */
	const float * (*world)(struct SceneGraph * scene_graph, int index);
	const CApiLocalTransform * (*local)(struct SceneGraph *scene_graph, int index);
	/* Returns the Scene Graph render handle to be used with the RenderSceneGraphApi */
	uint32_t (*render_handle)(struct SceneGraph *scene_graph);
	/* Transforms the scene graph using the specified node as root */
	void (*transform_with_root)(struct SceneGraph *scene_graph, int index, ConstMatrix4x4Ptr root);
	/* Unlinks the node at the index from its current parent */
	void (*unlink_internal)(struct SceneGraph *scene_graph, int index);
	/* Relinks a node back to its parent */
	void (*relink_internal)(struct SceneGraph *scene_graph, int index);
	uint32_t (*num_nodes)(struct SceneGraph *scene_graph);
	int (*parent)(struct SceneGraph *scene_graph, int index);
	uint8_t (*is_root)(struct SceneGraph * scene_graph, int index);
	uint32_t (*name)(struct SceneGraph *scene_graph, int index);
	/* Gain access to the entire array of nodes names */
	uint32_t * (*names_array_pointer)(struct SceneGraph *scene_graph);
	/* Gain access to the array of dirty_flags flags (useful when defining a post animation callback that changes local node transforms) */
	struct SceneFlags * (*dirty_array_pointer)(struct SceneGraph *scene_graph);
};

/* ----------------------------------------------------------------------
	Application
---------------------------------------------------------------------- */

/* Corresponds to engine ApplicationObjects type. */
struct ApplicationOptions;

/* Represents ANativeActivity on Android or the UIApplication on iOS */
struct AP_PlatformActivity;

/* Represents AndroidActivityCallbacks on Android or IOSActivityCallbacks on iOS */
struct PlatformActivityCallbacks;

enum AP_PlatformCallbackOrder
{
	AP_PRE_ACTIVITY,
	AP_POST_ACTIVITY
};

/* Maps to the corresponding function in Android's ANativeActivityCallbacks struct */
struct AndroidActivityCallbacks
{
	void (*start)(struct AP_PlatformActivity*);
	void (*resume)(struct AP_PlatformActivity*);
	void * (*save_instance_state)(struct AP_PlatformActivity*, size_t*);
	void (*pause)(struct AP_PlatformActivity*);
	void (*stop)(struct AP_PlatformActivity*);
	void (*destroy)(struct AP_PlatformActivity*);
	void (*window_focus_changed)(struct AP_PlatformActivity*, int);
	void (*native_window_created)(struct AP_PlatformActivity*, void*);
	void (*native_window_resized)(struct AP_PlatformActivity*, void*);
	void (*native_window_redraw_needed)(struct AP_PlatformActivity*, void*);
	void (*native_window_destroyed)(struct AP_PlatformActivity*, void*);
	void (*input_queue_created)(struct AP_PlatformActivity*, void*);
	void (*input_queue_destroyed)(struct AP_PlatformActivity*, void*);
	void (*content_rect_changed)(struct AP_PlatformActivity*, const void*);
	void (*configuration_changed)(struct AP_PlatformActivity*);
	void (*low_memory)(struct AP_PlatformActivity*);
};

/* Maps to Apple's standard iOS application callbacks */
struct IOSActivityCallbacks
{
	void (*did_finish_launching)(struct AP_PlatformActivity*);
	void (*will_enter_foreground)(struct AP_PlatformActivity*);
	void (*will_terminate)(struct AP_PlatformActivity*);
	void (*did_receive_memory_warning)(struct AP_PlatformActivity*);
	void (*will_resign_active)(struct AP_PlatformActivity*);
	void (*did_enter_background)(struct AP_PlatformActivity*);
	void (*did_become_active)(struct AP_PlatformActivity*);
};

typedef void (*AP_ReceiverFunction)(void *user_data, int client_id, ConstConfigRootPtr dv, const char *data, uint32_t data_length);

struct AP_ReceiverUserDataWrapper
{
	void *user_data;
	AP_ReceiverFunction function;
};

struct ApplicationApi
{
	/* Returns 16 floats */
	const struct ApplicationOptions * (*options)();

	/* Returns pointer to ConstConfigRoot */
	const void * (*settings)();

	/* Interface for native lifecycle handeling */
	struct AP_PlatformActivity * (*platform_activity)();
	void (*register_platform_callbacks)(enum AP_PlatformCallbackOrder, const struct PlatformActivityCallbacks*);
	void (*unregister_platform_callbacks)(enum AP_PlatformCallbackOrder, const struct PlatformActivityCallbacks*);
	int (*num_worlds)();
	void * (*world)(int index);

	const char * (*product_version)();

	void (*hook_console_receiver)(const char *type, struct AP_ReceiverUserDataWrapper *user_wrapper);
	void (*unhook_console_receiver)(const char *type);
	int (*current_client_id)();
	void (*console_send_with_binary_data)(const char *text, uint32_t text_len, const char *data, uint32_t data_len, uint8_t sync, int client_id);
};

/* ----------------------------------------------------------------------
	ApplicationOptions
---------------------------------------------------------------------- */

struct ApplicationOptionsApi
{
	const char * (*bundle_directory)(const struct ApplicationOptions * application_options);
	const char * (*data_directory)(const struct ApplicationOptions * application_options);
};

/* ----------------------------------------------------------------------
	ErrorContext
---------------------------------------------------------------------- */

struct ErrorContextApi
{
	void (*make_thread_error_context_stack)(struct AllocatorObject *allocator);
	void (*delete_thread_error_context_stack)(struct AllocatorObject *allocator);
	int (*has_thread_error_context_stack)();
};

/* ----------------------------------------------------------------------
	Raycast
---------------------------------------------------------------------- */

struct RaycastApi
{
	int(*find_first_collision)(
		CApiWorld *world,
		float ray_origin_x, float ray_origin_y, float ray_origin_z,
		float ray_direction_x, float ray_direction_y, float ray_direction_z,
		float ray_length,
		struct CollisionFilter *collision_filter,
		float *hit_position_x, float *hit_position_y, float *hit_position_z,
		float *hit_normal_x, float *hit_normal_y, float *hit_normal_z);
};

/* ----------------------------------------------------------------------
	FileSystem
---------------------------------------------------------------------- */

struct FileSystem;

struct FileSystemApi
{
	int (*exists)(struct FileSystem *filesystem, const char *filename);

	struct FileSystem * (*create)(const char *directory);
	void (*destroy)(struct FileSystem *filesystem);
};

/* ----------------------------------------------------------------------
	PluginManager
---------------------------------------------------------------------- */

struct PluginManagerApi
{
	/* The plugin_name must match the value defined in the plugin library api header.
	   Returns null in the following cases:
		     - Plugin is not loaded
				 - Plugin does not provide a plugin library api
		     - Name is wrong
	*/
	void * (*get_plugin_library_api)(const char * plugin_name);

	void (*load_delayed_plugin)(const char *dll_relative_path);
};

/* ----------------------------------------------------------------------
	World
---------------------------------------------------------------------- */

/* Corresponds to the LineObjectDrawer engine type */
struct LineObjectDrawer;

typedef void (*PostAnimationCallback)(CApiWorld * world_object, float dt);

struct WorldApi
{
	struct LineObjectDrawer * (*line_object_drawer)(CApiWorld * world);
	/* register for a post FK animation callback (to run IK for instance) */
	void (*register_post_animation_callback)(CApiWorld * world, PostAnimationCallback function);
	/* unregister a post FK animation callback */
	void (*unregister_post_animation_callback)(CApiWorld * world, PostAnimationCallback function);
	/* it is the responsibility of the plugin to free memory returned by find_units_by_resource_name */
	CApiUnit ** (*find_units_by_resource_name)(CApiWorld *world, uint64_t resource_name, struct AllocatorObject *allocator, unsigned *count);
};

/* ----------------------------------------------------------------------
	LineObjectDrawer
---------------------------------------------------------------------- */

/* Corresponds to the LineObject engine type */
struct LineObject;

/* Corresponds to the StateReflectionStream engine type */
struct StateReflectionStream;

struct LineObjectDrawerApi
{
	struct LineObject *(*new_line_object)(struct LineObjectDrawer * drawer);
	void (*release_line_object)(struct LineObjectDrawer * drawer, struct LineObject *lo);

	void (*dispatch)(struct LineObjectDrawer * drawer, struct StateReflectionStream *srs, struct LineObject *lo);

	void (*reset)(struct LineObject * lo);
	void (*add_lines)(struct LineObject * lo, unsigned * colors, float * line_starts, float * line_ends, unsigned n);
};

/* ----------------------------------------------------------------------
	Profiler
---------------------------------------------------------------------- */

struct ProfilerApi
{
	void (*profile_start)(const char *name);
	void (*profile_stop)();
};

/* ----------------------------------------------------------------------
	Error
---------------------------------------------------------------------- */

struct ErrorApi
{
	const char *(*eprintf)(const char *msg, ...);
	void (*report_crash)(const char *msg);
	void (*report_assert_failure)(int line, const char *file, const char *assert_test, const char *msg);
};

/* ----------------------------------------------------------------------
	RenderBuffer
---------------------------------------------------------------------- */

/* This enum lists all texture compression formats the engine supports and gets encoded into the buffer format (uint32_t) */
/* when user creates a format using RenderBufferApi::compressed_format(RB_CompressedFormat compression) */
typedef enum
{
	/* https://en.wikipedia.org/wiki/S3_Texture_Compression */
	RB_BLOCK_COMPRESSED_1 = 0x0,	/* BC1 */
	RB_BLOCK_COMPRESSED_2,			/* BC2 */
	RB_BLOCK_COMPRESSED_3,			/* BC3 */
	RB_BLOCK_COMPRESSED_4,			/* BC4 */
	RB_BLOCK_COMPRESSED_5,			/* BC5 */
	RB_BLOCK_COMPRESSED_6,			/* BC6 */
	RB_BLOCK_COMPRESSED_7,			/* BC7 */
	/* https://en.wikipedia.org/wiki/PVRTC */
	RB_PVR_RGB_2BPP		  = 0x100,	/* PVR RGB  2BPP */
	RB_PVR_RGBA_2BPP,				/* PVR RGBA 2BPP */
	RB_PVR_RGB_4BPP,				/* PVR RGB  4BPP */
	RB_PVR_RGBA_4BPP,				/* PVR RGBA 4BPP */
	/* https://en.wikipedia.org/wiki/Ericsson_Texture_Compression */
	RB_ETC2_RGB8		  = 0x200,	/* ETC2 RGB8 */
	RB_ETC2_RGB8A1,					/* ETC2 RGB8A1 */
	RB_ETC2_RGBA8,					/* ETC2 RGBA8 */
	RB_ETC2_R11,					/* ETC2 R11 */
	RB_ETC2_RG11					/* ETC2 RG11 */
} RB_CompressedFormat;

/* Buffer component type */
typedef enum
{
	RB_FLOAT_COMPONENT = 0,
	RB_INTEGER_COMPONENT = 1
} RB_ComponentType;

/* RenderBuffer Descriptors ---------------------------------------------*/

/* Vertex channel semantic names */
typedef enum
{
	RB_POSITION_SEMANTIC,
	RB_NORMAL_SEMANTIC,
	RB_TANGENT_SEMANTIC,
	RB_BINORMAL_SEMANTIC,
	RB_TEXCOORD_SEMANTIC,
	RB_COLOR_SEMANTIC,
	RB_BLEND_INDICES_SEMANTIC,
	RB_BLEND_WEIGHTS_SEMANTIC,
	RB_UNKNOWN_SEMANTIC,
	RB_SEMANTIC_COUNT = RB_UNKNOWN_SEMANTIC
} RB_VertexSemantic;

/* Describes a vertex channel inside a vertex buffer */
struct RB_VertexChannel
{
	uint32_t format;				/* Created using RenderBufferApi::format() */
	uint8_t semantic;				/* Semantic name from RB_VertexSemantic */
	uint8_t vb_index;				/* Vertex buffer index */
	uint8_t set;					/* Semantic set (TEXCOORD0, TEXCOORD1, etc..) */
	uint8_t instance;				/* true if vertex channel contains per instance data */
};

struct RB_VertexDescription
{
	struct RB_VertexChannel channels[16];
	uint32_t n_channels;
};

typedef enum
{
	RB_VERTEX_DESCRIPTION			/* View of RB_VertexDescription */
} RB_Description;

/* RenderBuffer Views -----------------------------------------*/

struct RB_VertexBufferView
{
	uint32_t stride;				/* Per vertex stride in bytes */
	uint32_t reserved[7];			/* Reserved for future use - Must be zero */
};

struct RB_IndexBufferView
{
	uint32_t stride;				/* Per index stride in bytes (must be 2 or 4) */
	uint32_t reserved[7];			/* Reserved for future use - must be zero */
};

struct RB_RawBufferView
{
	uint32_t format;				/* Format descriptor */
	uint32_t reserved[7];			/* Reserved for future use - Must be zero */
};

typedef enum
{
	RB_TEXTURE_TYPE_2D = 0,
	RB_TEXTURE_TYPE_CUBE = 1,
	RB_TEXTURE_TYPE_3D = 2
} RB_TextureBufferType;

struct RB_TextureBufferView
{
	uint32_t format;				/* Format of texture buffer */
	uint32_t type;					/* Type of texture, should be any of the available types in RB_TextureBufferType */
	uint32_t width;					/* Width of texture */
	uint32_t height;				/* Height of texture */
	uint32_t depth;					/* Depth of texture (Only used if type == RB_TEXTURE_TYPE_3D) */
	uint32_t slices;				/* Number of slices (1 for regular textures, >1 for texture arrays) */
	uint32_t mip_levels;			/* Number of mip levels in buffer */
	uint32_t reserved[7];			/* Reserved for future use - Must be zero */
};

typedef enum
{
	RB_VERTEX_BUFFER_VIEW,			/* View of RB_VertexBufferView */
	RB_INDEX_BUFFER_VIEW,			/* View of RB_IndexBufferView */
	RB_RAW_BUFFER_VIEW,				/* View of RB_RawBufferView */
	RB_TEXTURE_BUFFER_VIEW			/* View of RB_TextureBufferView */
} RB_View;

/* RenderBuffer Api----------------------------------------------*/

typedef enum
{
	RB_VALIDITY_STATIC,				/* Indicates that the contents of a buffer is immutable from the CPU, optional contents of buffer needs to passed to RenderBufferApi::create_buffer() */
	RB_VALIDITY_UPDATABLE			/* Indicates that the contents of a buffer is updatable from the CPU using the RenderBufferApi::update_buffer() method */
} RB_Validity;

struct RenderBufferApi
{
	/* Method for creating a format descriptor describing a piece of data in a buffer
			type = RB_FLOAT_COMPONENT or RB_INTEGER_COMPONENT
			signed_bool = true if component should be treated as signed
			normalize_bool = true if component should be as a normalized value when read in a shader
			bit_depth_ = number of bits per x,y,z,w component
	*/
	uint32_t (*format)(RB_ComponentType type, uint8_t signed_bool, uint8_t normalize_bool, uint8_t bit_depth_x, uint8_t bit_depth_y, uint8_t bit_depth_z, uint8_t bit_depth_w);

	/* Method for creating a format descriptor describing a compressed buffer
			compression = any of the available compression formats declared in RB_CompressedFormat
	*/
	uint32_t (*compressed_format)(RB_CompressedFormat compression);
	/* Returns true if format is compressed else false */
	uint8_t (*is_compressed)(uint32_t format);

	/* Returns total number of bits for format */
	uint32_t (*num_bits)(uint32_t format);
	/* Returns number of components in format */
	uint32_t (*num_components)(uint32_t format);
	/* Returns the component type for a format */
	RB_ComponentType (*component_type)(uint32_t format);

	/* Creates, Updates and Destroys a descriptor object */
	uint32_t (*create_description)(RB_Description view, const void *desc);
	void (*update_description)(uint32_t handle, const void *desc);
	void (*destroy_description)(uint32_t handle);

	/* Creates, Updates and Destroys a buffer */
	uint32_t (*create_buffer)(uint32_t size, RB_Validity validity, RB_View view, const void *view_data, const void *data);
	void (*update_buffer)(uint32_t handle, uint32_t size, const void *data);
	void (*destroy_buffer)(uint32_t handle);

	/* Translates a handle to a RenderResource that can be piped to MeshObjectApi::add_resource()/remove_resource() as well as the Lua interface Material.set_resource() */
	struct RenderResource* (*lookup_resource)(uint32_t handle);
};

/* ----------------------------------------------------------------------
	MeshObject
---------------------------------------------------------------------- */

typedef enum { MO_TRIANGLE_LIST, MO_LINE_LIST } MO_PrimitiveType;

struct MO_BatchInfo
{
	MO_PrimitiveType primitive_type;		/* Primitive */
	uint32_t material_index;				/* Index into material array set by MeshObjectApi::set_materials() function */
	uint32_t vertex_offset;					/* Offset to first vertex to read from vertex buffer. (If set when indexed this value is added to the index fetched from the index buffer before fetching the vertex) */
	uint32_t primitives;					/* Number of primitives to draw */
	uint32_t index_offset;					/* Offset to the first index to read from the index buffer (only valid when batch is indexed) */
	uint32_t vertices;						/* Number of vertices in batch (only valid if batch is non indexed) */
	uint32_t instances;						/* Number of instances of this batch to draw (1 equals no instancing) */
};

struct MO_Geometry
{
	void *vertices[8];						/* Holds 0-8 different vertex buffers, contents described by vertex_channels[]. If mesh references more than 8 vertex buffers MeshObjectApi will generate an error. */
	uint32_t vertex_stride[8];				/* Holds 0-8 strides, one for each buffer in vertices[] */
	uint32_t num_vertices;					/* Total number of vertices */
	struct RB_VertexDescription vertex_description;/* Vertex description */

	void *indices;							/* Pointer to index list */
	uint32_t index_stride;					/* Stride of index list (2 or 4) */
	uint32_t num_indices;					/* Total number of indicies */
};

typedef enum
{
	MO_VIEWPORT_VISIBLE_FLAG = 0x1,		/* Mesh is part of regular rendering */
	MO_SHADOW_CASTER_FLAG = 0x2,		/* Mesh is part of shadow rendering */
	MO_DISABLE_CULLING_FLAG = 0x4		/* Mesh always passes culling, i.e its bounding volume state is ignored. Note: might significantly impact performance */
} MO_Flags;

typedef enum
{
	MO_VIEWPORT_CONTEXT,				/* Visibility context for regular rendering */
	MO_SHADOW_CASTER_CONTEXT,			/* Visibility context for shadow casting */
	MO_ALL_CONTEXTS						/* Visibility context for both regular rendering and shadow casting */
} MO_VisibilityContexts;

struct MeshObjectApi
{
	/* Tries to retrieve the geometry of an existing mesh and if succesfull returns it in MO_Geometry (this will only give valid results when a representation of the geometry exists on the CPU side). */
	uint8_t (*read_geometry)(CApiUnit *unit, uint32_t mesh_name, struct MO_Geometry *geometry);

	/* Creates a new mesh object linked to the node referenced by node_name within the Unit referenced by unit. The mesh_name is given to the new MeshObject and can be used to retrieve the object from the Unit interface. flags is a combination of MO_Flags */
	uint32_t (*create)(CApiUnit *unit, uint32_t node_name, uint32_t mesh_name, uint32_t flags);
	/* Lookup an existing mesh object by name */
	uint32_t (*lookup)(CApiUnit *unit, uint32_t mesh_name);
	/* Destroy a mesh object created using create(), for meshes looked up using lookup() this is just releases the plugin handle. */
	void (*destroy)(uint32_t handle);

	/* Assigns an array of materials to the mesh. material_resources is an array of material resources retrieved using ResourceManagerApi::get() */
	void (*set_materials)(uint32_t handle, uint32_t num_materials, void **material_resources);
	/* Returns number of materials assigned to mesh */
	uint32_t (*num_materials)(uint32_t handle);
	/* Resturns pointer to material instance */
	void *(*material)(uint32_t handle, uint32_t material_index);

	/* Sets batch/drawcall information of mesh */
	void (*set_batch_info)(uint32_t handle, uint32_t num_infos, struct MO_BatchInfo *batch_infos);

	/* Add / removes resources such as vertex buffers, index buffers, vertex declarations created through the RenderBufferApi or piped down from Lua */
	void (*add_resource)(uint32_t handle, struct RenderResource *r);
	void (*remove_resource)(uint32_t handle, struct RenderResource *r);
	/* Clears any already assigned resources from a mesh */
	void (*clear_resources)(uint32_t handle);

	/* Sets min & max bounds in mesh local coordinates used for culling */
	void (*set_bounding_box)(uint32_t handle, float min[3], float max[3]);

	/* Sets visibility for a specific MO_VisibilityContext */
	void (*set_visibility)(uint32_t handle, uint32_t visibility_context, uint8_t visibility_bool);
	uint8_t (*visibility)(uint32_t handle, uint32_t visibility_context);

	/* Sets MO_Flags for object (will overrride the flags passed in create()) */
	void (*set_flags)(uint32_t handle, uint32_t flags);
	uint32_t (*flags)(uint32_t handle);
};

/* ----------------------------------------------------------------------
	SoundStreamSourceApi
---------------------------------------------------------------------- */

#pragma pack(push, 1)

/* Matches engine struct */
struct WaveFormat
{
	unsigned short      format_tag;					/* Tag specifing the format (e.g. WAVE_FORMAT_PCM) */
	unsigned short      num_channels;				/* Number of sound channels (e.g. 2) */
	unsigned			samples_per_second;			/* Samples per second (e.g. 44100) */
	unsigned			average_bytes_per_second;	/* Not used */
	unsigned short		block_align;				/* For MP3 files, samples per frame */
	unsigned short      bits_per_sample;			/* Bits per sample (e.g. 16) */
	unsigned short      size;						/* Number of extra bytes of header data */
};

#pragma pack(pop)

struct SoundData
{
	unsigned id; /* IdString32 equivalent */
	char debug_name[32];
};

struct SoundHeader
{
	unsigned	offset;			/* Offset of sample data in the file */
	unsigned	size;			/* Size of sample data */
	unsigned	num_samples;	/* Total number of samples (when unpacked) */
	struct SoundData	sound_data;		/* Category and debug information */
};

struct SoundResource;

struct GetNextChunkResult
{
	struct SoundResource * data;
	int is_finished;
};

struct SoundStreamSource; /* corresponds to engine StreamSource for sounds */
struct SoundStreamSourceApi
{
	struct GetNextChunkResult (*get_next_chunk)(struct SoundStreamSource * ss);

	struct SoundResource * (*get_resource)(struct SoundStreamSource * ss);

	struct SoundHeader (*resource_header)(struct SoundResource * sr);
	struct WaveFormat (*resource_format)(struct SoundResource * sr);
};

/* ----------------------------------------------------------------------
	MaterialApi
---------------------------------------------------------------------- */

struct MaterialApi
{
	void (*set_resources)(void *material, uint32_t num_resources, const uint32_t *resource_names, const struct RenderResource **resources);
	void (*set_constants)(void *material, uint32_t num_constants, const uint32_t *constant_names, const uint32_t *strides, const uint32_t *sizes, const void **constants);
};

/* ----------------------------------------------------------------------
	RenderSceneGraphApi
---------------------------------------------------------------------- */

/* RenderSceneGraphApi functions should only be on called on the render thread */
struct RenderSceneGraphApi
{
	/* Returns world matrix of specified scene graph node */
	ConstMatrix4x4Ptr (*world)(uint32_t render_handle, CApiWorld *world, unsigned index);
	/* Sets scene graph node world matrix */
	void (*set_world)(uint32_t render_handle, CApiWorld *world, unsigned index, ConstMatrix4x4Ptr m);
	/* Sets scene graph node world matrix and transform its children accordingly */
	void (*transform_hierarchy)(uint32_t render_handle, CApiWorld *world, const struct SceneGraph *graph, unsigned index, ConstMatrix4x4Ptr m);
};

/* ----------------------------------------------------------------------
	ThreadApi
---------------------------------------------------------------------- */

#define PLUGIN_THREAD_PRIORITY_IDLE -15
#define PLUGIN_THREAD_PRIORITY_LOWEST -2
#define PLUGIN_THREAD_PRIORITY_BELOW_NORMAL -1
#define PLUGIN_THREAD_PRIORITY_NORMAL 0
#define PLUGIN_THREAD_PRIORITY_ABOVE_NORMAL 1
#define PLUGIN_THREAD_PRIORITY_HIGHEST 2
#define PLUGIN_THREAD_PRIORITY_TIME_CRITICAL 15
typedef void* ThreadID;
typedef void (*ThreadEntry)(void* user_data);
struct ThreadEvent;
struct ThreadCriticalSection;

struct ThreadApi
{
	/* Creates a new thread and returns the thread ID. */
	ThreadID (*create_thread)(const char *thread_name, ThreadEntry entry, void *user_data, int priority);

	/* Returns true if the thread is alive. */
	int (*is_thread_alive)(ThreadID thread_id);

	/* Returns the name of the specified thread. */
	const char* (*thread_name)(ThreadID thread_id);

	/* Waits until thread is finished */
	void (*wait_for_thread)(ThreadID thread_id);

	/* Creates an Event for thread signalling. */
	struct ThreadEvent* (*create_event)(struct AllocatorObject *allocator, int manual_reset, int initial_state, const char *debug_name);
	void (*destroy_event)(struct ThreadEvent* evt, struct AllocatorObject *allocator );

	/* Interact with an Event. */
	void (*reset_event)(struct ThreadEvent* evt);
	void (*set_event)(struct ThreadEvent* evt);
	int (*is_event_set)(struct ThreadEvent* evt);
	void (*wait_for_event)(struct ThreadEvent* evt);
	int (*wait_for_event_timeout)(struct ThreadEvent* evt, unsigned timeout_ms);

	/* Creates a Critical Section for thread protection and locking. */
	struct ThreadCriticalSection* (*create_critical_section)(struct AllocatorObject *allocator);
	void (*destroy_critical_section)(struct ThreadCriticalSection* cs, struct AllocatorObject *allocator);

	/* Interact with a Critical Section. */
	void (*enter_critical_section)(struct ThreadCriticalSection* cs);
	void (*leave_critical_section)(struct ThreadCriticalSection* cs);
	int (*try_to_enter_critical_section)(struct ThreadCriticalSection* cs);

};

struct TimerApi
{
	uint64_t (*ticks)();
	double (*ticks_to_seconds)(uint64_t ticks);
};

/* ----------------------------------------------------------------------
	StreamCaptureApi
---------------------------------------------------------------------- */

struct SC_Buffer {
	uint32_t frame;

	/* format descriptor, use RenderBufferApi to interpret */
	uint32_t format;

	/* surface dimension */
	uint32_t width;
	uint32_t height;

	/* bits in buffer */
	void *data;
};

struct StreamCaptureApi
{
	/* Enables stream capture modifiers */
	void (*enable_capture)(void *window, uint32_t n_buffers, uint32_t *buffer_names);
	/* Disables stream capture modifiers */
	void (*disable_capture)(void *window, uint32_t n_buffers, uint32_t *buffer_names);
	/* Extract data from named capture modifier, return true if successfull */
	uint8_t (*capture_buffer)(void *window, uint32_t name, struct AllocatorObject *allocator, struct SC_Buffer *output);
};

/* ----------------------------------------------------------------------
	FlowApi
---------------------------------------------------------------------- */

struct FlowTriggerContext;
struct FlowOutputEvents;

#define PLUGIN_QUERY_EVENT	0xffff

struct FlowData
{
	unsigned short node_type;
	unsigned short event_index;
	const struct FlowOutputEvents* out_events;
};

#define PLUGIN_FLOW_NODES_MAX_PARAMS 63
#define PLUGIN_FLOW_STRING_VARIABLE_LENGTH 128

struct FlowParameters {
	const void* parameters[PLUGIN_FLOW_NODES_MAX_PARAMS + 1];
};

typedef void (*FlowFunction)(struct FlowTriggerContext* tc, const struct FlowData *fd, const struct FlowParameters *fp);
typedef void (*SetVariableFunction)(struct FlowTriggerContext* tc, const struct FlowParameters *fp, unsigned key, void *data);
typedef void (*EventCallbackFunction)(struct FlowTriggerContext* tc, const struct FlowData *fd, const struct FlowParameters *fp);

// Type            Input field (can be null)                 Output field (not null)
//
// "unit"          const CApiUnitRef*                        CApiUnitRef*
// "actor"         const CApiActor*                          CApiActor*
// "mover"         const CApiMover*                          CApiMover*
// "vector3"       const CApiVector3*                        CApiVector3*
// "float"         const float*                              float*
// "bool"          const unsigned*                           unsigned*
// "string"        const char*                               char[PLUGIN_FLOW_STRING_VARIABLE_LENGTH]
// "id"            const uint64_t*                           uint64_t*
// "quaternion"    const CApiQuaternion*                     CApiQuaternion*
// "unsigned"      const unsigned*                           unsigned*
// "camera"        const CApiCamera*                         CApiCamera*
// "light"         const CApiLight*                          CApiLight*
// "mesh"          const CApiMesh*                           CApiMesh*
// "material"      const CApiMaterial*                       CApiMaterial*
// "resource"      char[PLUGIN_FLOW_STRING_VARIABLE_LENGTH]
// "enum"          int

struct FlowNodesApi
{
	void (*setup_trigger_function)(const char* name, FlowFunction trigger_function);
	void (*setup_event_callback)(const char* name, EventCallbackFunction event_callback_function);
	void (*setup_set_variable_callback)(const char* name, SetVariableFunction variable_callback_function);
	void (*unregister_flow_node)(const char* name);
	void (*trigger_out_event)(struct FlowTriggerContext *tc, const struct FlowData* fd, int event_index);
	void (*trigger_external_level_event)(CApiLevel *level, unsigned id_string_32);
	void (*trigger_external_unit_event)(CApiUnit *unit, unsigned id_string_32);
};

/* ----------------------------------------------------------------------
CameraApi
---------------------------------------------------------------------- */
typedef enum
{
	C_MONO,
	C_STEREO
} C_Mode;

typedef enum
{
	C_ORTHOGRAPHIC,
	C_PERSPECTIVE
} C_ProjectionType;

struct CameraApi
{
	struct SceneGraph * (*scene_graph)(CApiCamera *camera);

	float (*near_range)(CApiCamera *camera);
	void  (*set_near_range)(CApiCamera *, float near_range);

	float (*far_range)(CApiCamera *camera);
	void  (*set_far_range)(CApiCamera *camera, float far_range);

	uint8_t (*projection_type)(CApiCamera *camera);
	void    (*set_projection_type)(CApiCamera *camera, uint8_t projection_type);

	float (*vertical_fov)(CApiCamera *camera, unsigned i);
	void  (*set_vertical_fov)(CApiCamera *camera, float fov, unsigned i);

	void (*set_frustum)(CApiCamera *camera, float left, float right, float bottom, float top, unsigned i);
	void (*set_frustum_half_angles)(CApiCamera *camera, float left_tan, float right_tan, float bottom_tan, float top_tan, unsigned i);

	uint8_t (*mode)(CApiCamera *camera);
	void    (*set_mode)(CApiCamera *camera, uint8_t mode);

	void (*set_local)(CApiCamera *camera, ConstMatrix4x4Ptr offset, unsigned i);
};

#ifdef __cplusplus
}
#endif
