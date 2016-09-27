#include "sample_flow_node.h"

#include <plugin_foundation/vector3.h>
#include <plugin_foundation/id_string.h>
#include <plugin_foundation/string.h>

using namespace stingray_plugin_foundation;

namespace PLUGIN_NAMESPACE
{

static struct FlowNodesApi *_flow_nodes_api = 0;

const char sample_flow_node_name[] = "sample_flow_node";

enum class SampleInputEvent
{
	first = 0,
	second = 1
};

enum class SampleOutputEvent
{
	carl = 0,
	peter = 1
};

struct SampleTriggerStaticData
{
	char* name;	// Static data should not change once loaded (set_variable_callbacks may change content, trigger functions etc may not)
};

struct SampleTriggerNodeData
{
	const float *scale;			// Input parameters are const inputs pointers that can be null if not connected in the flow graph
	const Vector3 *size;
	float &event_id;			// Output parameters are pointers, but use references since they can never be null
	Vector3 &scaled_size;
	unsigned &max_run_count;	// Dynamics parameters are pointers, but use references since they can never be null
	const SampleTriggerStaticData &static_data;	// Static data is only pointer to your static data chunk. It is really a pointer, but use references since it can never be null
};

static const ConstString carl("Carl");
static const ConstString peter("Peter");
static const IdString32 name_variable_id("name");

extern "C" void sample_trigger(struct FlowTriggerContext* tc, const struct FlowData *fd, const struct FlowParameters *fp)
{
	const SampleTriggerNodeData& node_data = (const SampleTriggerNodeData&)*fp;

	switch (fd->event_index)
	{
		case (int)SampleInputEvent::first:
			node_data.event_id = 0;

			break;
		case (int)SampleInputEvent::second:
			node_data.event_id = 1;
			break;
	}

	if (node_data.scale && node_data.size) {
		if (node_data.max_run_count)
			--node_data.max_run_count;

		node_data.scaled_size = (*node_data.size) * (*node_data.scale);
	}

	if (carl == node_data.static_data.name)
		_flow_nodes_api->trigger_out_event(tc, fd, (int)SampleOutputEvent::carl);
	else if (peter == node_data.static_data.name)
		_flow_nodes_api->trigger_out_event(tc, fd, (int)SampleOutputEvent::peter);
}

extern "C" void sample_event_callback(struct FlowTriggerContext* tc, const struct FlowData *fd, const struct FlowParameters *fp)
{
//	const SampleTriggerNodeData& node_data = (const SampleTriggerNodeData&)*fp;
}

extern "C" void sample_set_variable_callback(struct FlowTriggerContext* tc, const struct FlowParameters *fp, unsigned key, void *data)
{
	const SampleTriggerNodeData& node_data = (const SampleTriggerNodeData&)*fp;

	if (name_variable_id.id() == key)
	{
		strncpy(node_data.static_data.name, (const char*)data, PLUGIN_FLOW_STRING_VARIABLE_LENGTH);
		node_data.static_data.name[PLUGIN_FLOW_STRING_VARIABLE_LENGTH] = 0;
	}
}

void init_sample_flow_node(GetApiFunction get_engine_api)
{
	_flow_nodes_api = (FlowNodesApi *)get_engine_api(FLOW_NODES_API_ID);
	_flow_nodes_api->setup_trigger_function(sample_flow_node_name, sample_trigger);
	_flow_nodes_api->setup_set_variable_callback(sample_flow_node_name, sample_set_variable_callback);
	_flow_nodes_api->setup_event_callback(sample_flow_node_name, sample_event_callback);
}

void shutdown_sample_flow_node()
{
	_flow_nodes_api->unregister_flow_node(sample_flow_node_name);
	_flow_nodes_api = nullptr;
}

}
