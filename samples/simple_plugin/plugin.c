#include <engine_plugin_api/plugin_api.h>
#include <plugin_foundation/platform.h>
#include <stdio.h>

struct LuaApi *_lua = NULL;
struct PluginManagerApi *_plugin_manager = NULL;

unsigned GRAPH_API_ID = 0x92d3ccbe;

struct GraphApi
{
	struct GraphResourceHeader * (*get)(const char *graph_name);
	int (*num_nodes)(struct GraphResourceHeader *graph);
	int (*num_links)(struct GraphResourceHeader *graph);
	void (*node_position)(struct GraphResourceHeader *graph, int node, float pos[3]);
	void (*link_nodes)(struct GraphResourceHeader *graph, int link, int *from, int *to);
};

static int test(struct lua_State *L)
{
	double a = _lua->tonumber(L, 1);
	double b = _lua->tonumber(L, 2);
	_lua->pushnumber(L, a+b);
	return 1;
}

static int test_cross_plugin_call(struct lua_State *L)
{
	struct GraphApi *graph_api = _plugin_manager->get_next_plugin_api(GRAPH_API_ID, NULL);
	if (!graph_api) {
		_lua->pushstring(L, "GraphApi not found");
		return 1;
	}
	struct GraphResourceHeader *graph = graph_api->get("test");
	if (!graph) {
		_lua->pushstring(L, "No graph named `test` found in current project");
		return 1;
	}
	int num_nodes = graph_api->num_nodes(graph);
	char buffer[200];
	sprintf(buffer, "Graph `test` has %d nodes", num_nodes);
	_lua->pushstring(L, buffer);
	return 1;
}

static void setup_game(GetApiFunction get_engine_api)
{
	_lua = get_engine_api(LUA_API_ID);
	_plugin_manager = get_engine_api(PLUGIN_MANAGER_API_ID);

	_lua->add_module_function("SimplePlugin", "test", test);
	_lua->add_module_function("SimplePlugin", "test_cross_plugin_call", test_cross_plugin_call);
}

static void shutdown_game()
{
	_lua->remove_all_module_entries("SimplePlugin");
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
		api.shutdown_game = shutdown_game;
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
