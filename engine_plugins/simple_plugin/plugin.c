#include <engine_plugin_api/plugin_api.h>
#include <plugin_foundation/platform.h>

struct LuaApi *_lua;

static int test(struct lua_State *L)
{
	double a = _lua->tonumber(L, 1);
	double b = _lua->tonumber(L, 2);
	_lua->pushnumber(L, a+b);
	return 1;
}

static void setup_game(GetApiFunction get_engine_api)
{
	_lua = get_engine_api(LUA_API_ID);

	_lua->add_module_function("SimplePlugin", "test", test);
}

static const char* get_name()
{
	return "simple_plugin";
}

void *get_simple_plugin_api(unsigned api)
{
	if (api == PLUGIN_API_ID) {
		static struct PluginApi api = {0};
		api.setup_game = setup_game;
		api.get_name = get_name;
		return &api;
	}
	return 0;
}

#if !defined STATIC_PLUGIN_LINKING
	PLUGIN_DLLEXPORT void *get_plugin_api(unsigned api)
	{
		return get_simple_plugin_api(api);
	}
#endif
