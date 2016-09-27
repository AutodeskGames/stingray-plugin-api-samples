#include "profiler_flow_node.h"

#include <plugin_foundation/vector3.h>
#include <plugin_foundation/platform.h>

using namespace stingray_plugin_foundation;

namespace PLUGIN_NAMESPACE
{

static struct FlowNodesApi *_flow_nodes_api = nullptr;
static struct ProfilerApi *_profiler_api = nullptr;

const char profiler_flow_node_name[] = "profiler";

enum class ProfilerInputEvent
{
	start = 0,
	stop = 1
};

enum class ProfilerOutputEvent
{
	started = 0,
	stopped = 1
};

struct ProfilerTriggerNodeData
{
	const char *name;		// Input parameters are const inputs pointer that can be null if not connected in the flow graph
};

extern "C" void profiler_trigger(struct FlowTriggerContext* tc, const struct FlowData *fd, const struct FlowParameters *fp)
{
	const ProfilerTriggerNodeData& node_data = (const ProfilerTriggerNodeData&)*fp;

	if (node_data.name)
	{
		switch (fd->event_index)
		{
			case (int)ProfilerInputEvent::start:
				_profiler_api->profile_start(node_data.name);
				_flow_nodes_api->trigger_out_event(tc, fd, (int)ProfilerOutputEvent::started);
				break;
			case (int)ProfilerInputEvent::stop:
				_profiler_api->profile_stop();
				_flow_nodes_api->trigger_out_event(tc, fd, (int)ProfilerOutputEvent::stopped);
				break;
		}
	}
}

void init_profiler_flow_node(GetApiFunction get_engine_api)
{
	_flow_nodes_api = (FlowNodesApi *)get_engine_api(FLOW_NODES_API_ID);
	_profiler_api = (ProfilerApi *)get_engine_api(PROFILER_API_ID);
	_flow_nodes_api->setup_trigger_function(profiler_flow_node_name, profiler_trigger);
}

void shutdown_profiler_flow_node()
{
	_flow_nodes_api->unregister_flow_node(profiler_flow_node_name);
	_flow_nodes_api = nullptr;
	_profiler_api = nullptr;
}

}
