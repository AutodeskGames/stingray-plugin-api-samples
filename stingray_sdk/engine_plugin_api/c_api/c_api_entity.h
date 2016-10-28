#pragma once

#include "c_api_types.h"
#include "entity_components/c_api_data_component.h"
#include "entity_components/c_api_render_data_component.h"
#include "entity_components/c_api_debug_name_component.h"
#include "entity_components/c_api_tag_component.h"
#include "entity_components/c_api_animation_state_machine_component.h"
#include "entity_components/c_api_animation_blender_component.h"
#include "entity_components/c_api_scene_graph_component.h"
#include "entity_components/c_api_actor_component.h"
#include "entity_components/c_api_mesh_component.h"
#include "entity_components/c_api_transform_component.h"

#ifdef __cplusplus
extern "C" {
#endif

struct EntityManagerApi
{
	EntityRef	(*create) (ConstWorldPtr optional);
	void		(*destroy) (EntityRef);
	int			(*is_alive) (EntityRef);
	void		(*set_debug_name) (EntityRef, const char*);
	EntityRef	(*spawn) (WorldPtr, uint64_t entity_name_id64, const char *optional_debug_entity_name, ConstMatrix4x4Ptr transform);
};

struct EntityCApi
{
	struct EntityManagerApi*	Manager;

	/*
		Retrieves a pointer to the Component API registered with the specified name.
		To use the member functions of the specified Component API cast the ComponentApiPtr to the relevant definition represented in it's header file."
	*/
	ComponentApiPtr	(*component_api) (const char* name);

	/*	Registers a pointer to a component api with the specified name, the caller is responsible for keeping it allocated.	*/
	void	(*register_component_api) (const char* name, ComponentApiPtr component_api_struct);

	/*	Returns true (1) if a component api with the specified name has already been registered.	*/
	int		(*has_component_api) (const char* name);

	/*	Unregisters a component struct with the specified name.	*/
	void	(*unregister_component_api) (const char* name);
};

#ifdef __cplusplus
}
#endif
