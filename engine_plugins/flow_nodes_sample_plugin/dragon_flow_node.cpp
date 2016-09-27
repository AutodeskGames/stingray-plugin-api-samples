#include "dragon_flow_node.h"

#include <plugin_foundation/vector3.h>
#include <plugin_foundation/id_string.h>

using namespace stingray_plugin_foundation;

namespace PLUGIN_NAMESPACE
{

static struct FlowNodesApi *_flow_nodes_api = nullptr;

const IdString32 lindworm("Lindworm");
const IdString32 wyvern("Wyvern");
const IdString32 y_ddraig_goch("Y Ddraig Goch");
const IdString32 kulshedra("Kulshedra");

const IdString32 sheep("sheep");
const IdString32 carrots("carrots");
const IdString32 apples("apples");
const IdString32 frog("frog");

struct Dragon
{
	IdString32 type;
	char name[PLUGIN_FLOW_STRING_VARIABLE_LENGTH];
	float age;
	float weight;
};

const char create_dragon_node_name[] = "create_dragon";

extern "C" void create_dragon_trigger(struct FlowTriggerContext* tc, const struct FlowData *fd, const struct FlowParameters *fp)
{
	const struct NodeData {
		const int *type;
		const char *name;
		const float *age;
		const float *weight;
		Dragon &dragon;
	} &node_data = (const NodeData&)*fp;

	if (node_data.type && node_data.name && node_data.weight)
	{
		node_data.dragon.type = IdString32((unsigned)*node_data.type);
		strncpy(node_data.dragon.name, node_data.name, PLUGIN_FLOW_STRING_VARIABLE_LENGTH);
		node_data.dragon.name[PLUGIN_FLOW_STRING_VARIABLE_LENGTH - 1] = 0;
		node_data.dragon.age = *node_data.age;
		node_data.dragon.weight = *node_data.weight;
		_flow_nodes_api->trigger_out_event(tc, fd, 0);
	}
}

const char kill_dragon_node_name[] = "kill_dragon";

extern "C" void kill_dragon_trigger(struct FlowTriggerContext* tc, const struct FlowData *fd, const struct FlowParameters *fp)
{
	const struct NodeData {
		const Dragon *dragon;
	} &node_data = (const NodeData&)*fp;

	if (node_data.dragon)
	{
		if (node_data.dragon->type != IdString32())
		{
			memset((Dragon*)node_data.dragon, sizeof(Dragon), 0);
			_flow_nodes_api->trigger_out_event(tc, fd, 0);
		}
	}
}

const char get_dragon_type_node_name[] = "get_dragon_type";

extern "C" void get_dragon_type_trigger(struct FlowTriggerContext* tc, const struct FlowData *fd, const struct FlowParameters *fp)
{
	const struct NodeData {
		const Dragon *dragon;
		char *type;
	} &node_data = (const NodeData&)*fp;

	node_data.type[0] = 0;
	if (node_data.dragon)
	{
		if (node_data.dragon->type != IdString32())
		{
			if (node_data.dragon->type == lindworm)
				strncpy(node_data.type, "Lindworm", PLUGIN_FLOW_STRING_VARIABLE_LENGTH);
			else if(node_data.dragon->type == wyvern)
				strncpy(node_data.type, "Wyvern", PLUGIN_FLOW_STRING_VARIABLE_LENGTH);
			else if(node_data.dragon->type == y_ddraig_goch)
				strncpy(node_data.type, "Y Ddraig Goch", PLUGIN_FLOW_STRING_VARIABLE_LENGTH);
			else if(node_data.dragon->type == kulshedra)
				strncpy(node_data.type, "Kulshedra", PLUGIN_FLOW_STRING_VARIABLE_LENGTH);
		}
	}
}

const char get_dragon_age_node_name[] = "get_dragon_age";

extern "C" void get_dragon_age_trigger(struct FlowTriggerContext* tc, const struct FlowData *fd, const struct FlowParameters *fp)
{
	const struct NodeData {
		const Dragon *dragon;
		float &age;
	} &node_data = (const NodeData&)*fp;

	if (node_data.dragon && node_data.dragon->type != IdString32())
		node_data.age = node_data.dragon->age;
	else
		node_data.age = 0.f;
}

const char get_dragon_weight_node_name[] = "get_dragon_weight";

extern "C" void get_dragon_weight_trigger(struct FlowTriggerContext* tc, const struct FlowData *fd, const struct FlowParameters *fp)
{
	const struct NodeData {
		const Dragon *dragon;
		float &weight;
	} &node_data = (const NodeData&)*fp;

	if (node_data.dragon && node_data.dragon->type != IdString32())
		node_data.weight = node_data.dragon->weight;
	else
		node_data.weight = 0.f;
}

const char feed_dragon_node_name[] = "feed_dragon";

extern "C" void feed_dragon_trigger(struct FlowTriggerContext* tc, const struct FlowData *fd, const struct FlowParameters *fp)
{
	const struct NodeData {
		const Dragon *dragon;
		unsigned int *food;
	} &node_data = (const NodeData&)*fp;

	enum {FEED_DRAGON_EVENT_ATE, FEED_DRAGON_EVENT_HATE};

	if (node_data.dragon && node_data.food && node_data.dragon->type != IdString32())
	{
		if (node_data.dragon->type == lindworm)
		{
			// A Lindworm eats anything!
			if (*node_data.food == sheep.id())
				((Dragon*)node_data.dragon)->weight += 100.f;
			else if (*node_data.food == carrots.id())
				((Dragon*)node_data.dragon)->weight += 5.f;
			else if (*node_data.food == apples.id())
				((Dragon*)node_data.dragon)->weight += 8.f;
			else if (*node_data.food == frog.id())
				((Dragon*)node_data.dragon)->weight += 25.f;

			_flow_nodes_api->trigger_out_event(tc, fd, FEED_DRAGON_EVENT_ATE);
		}
		else if(node_data.dragon->type == wyvern)
		{
			// A Wyvern is vegetarian
			if (*node_data.food == carrots.id())
			{
				((Dragon*)node_data.dragon)->weight += 5.f;
				_flow_nodes_api->trigger_out_event(tc, fd, FEED_DRAGON_EVENT_ATE);
			}
			else if (*node_data.food == apples.id())
			{
				((Dragon*)node_data.dragon)->weight += 8.f;
				_flow_nodes_api->trigger_out_event(tc, fd, FEED_DRAGON_EVENT_ATE);
			}
			else
			{
				_flow_nodes_api->trigger_out_event(tc, fd, FEED_DRAGON_EVENT_HATE);
			}
		}
		else if(node_data.dragon->type == y_ddraig_goch)
		{
			// A Y Ddraig Goch lives of frogs alone
			if (*node_data.food == frog.id())
			{
				((Dragon*)node_data.dragon)->weight += 25.f;
				_flow_nodes_api->trigger_out_event(tc, fd, FEED_DRAGON_EVENT_ATE);
			}
			else
			{
				_flow_nodes_api->trigger_out_event(tc, fd, FEED_DRAGON_EVENT_HATE);
			}
		}
		else if(node_data.dragon->type == kulshedra)
		{
			// A Kulshedra lives only east non-amfibic meat
			if (*node_data.food == sheep.id())
			{
				((Dragon*)node_data.dragon)->weight += 100.f;
				_flow_nodes_api->trigger_out_event(tc, fd, FEED_DRAGON_EVENT_ATE);
			}
			else
			{
				_flow_nodes_api->trigger_out_event(tc, fd, FEED_DRAGON_EVENT_HATE);
			}
		}
	}
}

void init_dragon_flow_node(GetApiFunction get_engine_api)
{
	_flow_nodes_api = (FlowNodesApi *)get_engine_api(FLOW_NODES_API_ID);
	_flow_nodes_api->setup_trigger_function(create_dragon_node_name, create_dragon_trigger);
	_flow_nodes_api->setup_trigger_function(kill_dragon_node_name, kill_dragon_trigger);
	_flow_nodes_api->setup_trigger_function(get_dragon_type_node_name, get_dragon_type_trigger);
	_flow_nodes_api->setup_trigger_function(get_dragon_age_node_name, get_dragon_age_trigger);
	_flow_nodes_api->setup_trigger_function(get_dragon_weight_node_name, get_dragon_weight_trigger);
	_flow_nodes_api->setup_trigger_function(feed_dragon_node_name, feed_dragon_trigger);
}

void shutdown_dragon_flow_node()
{
	_flow_nodes_api->unregister_flow_node(feed_dragon_node_name);
	_flow_nodes_api->unregister_flow_node(get_dragon_weight_node_name);
	_flow_nodes_api->unregister_flow_node(get_dragon_age_node_name);
	_flow_nodes_api->unregister_flow_node(get_dragon_type_node_name);
	_flow_nodes_api->unregister_flow_node(kill_dragon_node_name);
	_flow_nodes_api->unregister_flow_node(create_dragon_node_name);
	_flow_nodes_api = nullptr;
}

}
