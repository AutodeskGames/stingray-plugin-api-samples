#pragma once

#include "c_api_types.h"

#ifdef __cplusplus
extern "C" {
#endif

enum DynamicScriptDataType
{
	D_DATA_NIL_TYPE,
	D_DATA_BOOLEAN_TYPE,
	D_DATA_NUMBER_TYPE,
	D_DATA_STRING_TYPE,
	D_DATA_CUSTOM_TVECTOR2 = 100,
	D_DATA_CUSTOM_TVECTOR3,
	D_DATA_CUSTOM_TVECTOR4,
	D_DATA_CUSTOM_TMATRIX4X4,
	D_DATA_CUSTOM_TUNITREFERENCE,
	D_DATA_CUSTOM_TPOINTER,
	D_DATA_CUSTOM_TLUAREF /* Custom Lua reference is currently not supported via the C Api's DynamicScriptData. */
};

typedef struct DynamicScriptDataItem {
	const void *pointer;
	enum DynamicScriptDataType type;
	unsigned size;
} DynamicScriptDataItem;


struct DynamicScriptDataUnitApi
{
	int						(*has_data) (UnitRef, unsigned num_identifiers, ...);
	void					(*set_data) (UnitRef, DynamicScriptDataItem*, unsigned num_identifiers, ...);
	DynamicScriptDataItem	(*get_data) (UnitRef, unsigned num_identifiers, ...);
};

struct DynamicScriptDataCameraCApi
{
	int						(*has_data) (CameraPtr, unsigned num_identifiers, ...);
	void					(*set_data) (CameraPtr, DynamicScriptDataItem*, unsigned num_identifiers, ...);
	DynamicScriptDataItem	(*get_data) (CameraPtr, unsigned num_identifiers, ...);
};

struct DynamicScriptDataLevelCApi
{
	int						(*has_data) (LevelPtr, unsigned num_identifiers, ...);
	void					(*set_data) (LevelPtr, DynamicScriptDataItem*, unsigned num_identifiers, ...);
	DynamicScriptDataItem	(*get_data) (LevelPtr, unsigned num_identifiers, ...);
};

struct DynamicScriptDataWorldCApi
{
	int						(*has_data) (WorldPtr, unsigned num_identifiers, ...);
	void					(*set_data) (WorldPtr, DynamicScriptDataItem*, unsigned num_identifiers, ...);
	DynamicScriptDataItem	(*get_data) (WorldPtr, unsigned num_identifiers, ...);
};

struct DynamicScriptDataViewportCApi
{
	int						(*has_data) (ViewportPtr, unsigned num_identifiers, ...);
	void					(*set_data) (ViewportPtr, DynamicScriptDataItem*, unsigned num_identifiers, ...);
	DynamicScriptDataItem	(*get_data) (ViewportPtr, unsigned num_identifiers, ...);
};

struct DynamicScriptDataApplicationCApi
{
	int						(*has_data) (unsigned num_identifiers, ...);
	void					(*set_data) (DynamicScriptDataItem*, unsigned num_identifiers, ...);
	DynamicScriptDataItem	(*get_data) (unsigned num_identifiers, ...);
};

struct DynamicScriptDataCApi
{
	struct DynamicScriptDataUnitApi*	Unit;
	struct DynamicScriptDataCameraCApi* Camera;
	struct DynamicScriptDataLevelCApi*	Level;
	struct DynamicScriptDataWorldCApi*	World;
	struct DynamicScriptDataViewportCApi*	 Viewport;
	struct DynamicScriptDataApplicationCApi* Application;
};

#ifdef __cplusplus
}
#endif
