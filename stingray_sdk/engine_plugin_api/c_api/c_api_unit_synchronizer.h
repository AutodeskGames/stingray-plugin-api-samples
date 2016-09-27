#pragma once

#include "c_api_types.h"

#ifdef __cplusplus
extern "C" {
#endif

struct UnitSynchronizerCApi
{
	void	(*set_world) (UnitSynchronizerPtr, WorldPtr);
	UnitRef (*spawn_unit) (UnitSynchronizerPtr, unsigned unit_type_id32, uint64_t unit_name_id64, ConstMatrix4x4Ptr transform);
	void	(*destroy_unit) (UnitSynchronizerPtr, UnitRef);

	UnitRef		(*game_object_id_to_unit) (UnitSynchronizerPtr, unsigned index);
	unsigned	(*unit_to_game_object_id) (UnitSynchronizerPtr, UnitRef);
};

#ifdef __cplusplus
}
#endif
