#pragma once

#include "../c_api_types.h"

#ifdef __cplusplus
extern "C" {
#endif

struct TagComponentCApi
{
	TagComponentPtr		(*component) (WorldPtr);

	InstanceId	(*create) (TagComponentPtr, EntityRef);
	void		(*destroy) (TagComponentPtr, EntityRef);
	int			(*has_instance) (ComponentPtr, EntityRef);

	/*	All property keys should be in the format of const char*	*/
	int			(*get_property) (TagComponentPtr, EntityRef, unsigned num_args, ...);
	void		(*set_property) (TagComponentPtr, EntityRef, int should_add_key_as_tag, unsigned num_args, ...);

	// Fills the specified buffer with up to (buffer_size) number of entities that has the tag.
	// Returns the total number of entities the tag has.
	unsigned	(*get_entities) (ComponentPtr, unsigned tag_id32, EntityRef *buffer, unsigned buffer_size);

	void		(*add_tag) (TagComponentPtr, EntityRef, unsigned tag_id32);
	void		(*remove_tag) (TagComponentPtr, EntityRef, unsigned tag_id32);
	int			(*has_tag) (TagComponentPtr, EntityRef, unsigned tag_id32);
};

#ifdef __cplusplus
}
#endif
