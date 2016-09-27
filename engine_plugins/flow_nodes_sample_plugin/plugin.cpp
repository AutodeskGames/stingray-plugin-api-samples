#include <engine_plugin_api/plugin_api.h>
#include <plugin_foundation/platform.h>

#include "sample_flow_node.h"
#include "profiler_flow_node.h"
#include "dragon_flow_node.h"

namespace PLUGIN_NAMESPACE
{

static void setup_game(GetApiFunction get_engine_api)
{
	init_sample_flow_node(get_engine_api);
	init_profiler_flow_node(get_engine_api);
	init_dragon_flow_node(get_engine_api);
}

static void shutdown_game()
{
	shutdown_dragon_flow_node();
	shutdown_profiler_flow_node();
	shutdown_sample_flow_node();
}

static const char* get_name()
{
	return "flow_nodes_sample_plugin";
}

}

extern "C" {
	void *get_flow_nodes_sample_plugin_api(unsigned api)
	{
		if (api == PLUGIN_API_ID) {
			static struct PluginApi api = { 0 };
			api.setup_game = PLUGIN_NAMESPACE::setup_game;
			api.shutdown_game = PLUGIN_NAMESPACE::shutdown_game;
			api.get_name = PLUGIN_NAMESPACE::get_name;
			return &api;
		}
		return nullptr;
	}

	#if !defined STATIC_PLUGIN_LINKING
		PLUGIN_DLLEXPORT void *get_plugin_api(unsigned api)
		{
			return get_flow_nodes_sample_plugin_api(api);
		}
	#endif
}
