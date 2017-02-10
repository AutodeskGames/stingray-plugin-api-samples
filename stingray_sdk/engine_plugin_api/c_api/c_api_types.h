#pragma once

/*
	* These types mainly exist to simplify the otherwise ambiguous abstracted void pointers used by the ScriptApi.
	* They should be able to be casted to and treated the same way their respective plugin_foundation type is.
*/

/*
*	All functions declared as "unsigned find_x(name)" will return UINT_MAX when no index was found.
*/

#include "../plugin_api_types.h"
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif
	typedef CApiStoryTeller* StoryTellerPtr;
	typedef CApiWorld* WorldPtr;
	typedef CApiLevel* LevelPtr;
	typedef CApiScatterSystem* ScatterSystemPtr;
	typedef CApiVectorField* VectorFieldPtr;
	typedef CApiCamera* CameraPtr;
	typedef CApiViewport* ViewportPtr;
	typedef CApiShadingEnvironment* ShadingEnvironmentPtr;
	typedef CApiActor* ActorPtr;
	typedef void* TerrainPtr;
	typedef CApiMover* MoverPtr;
	typedef CApiMaterial* MaterialPtr;
	typedef void* LanLobbyPtr;
	typedef void* LanLobbyBrowserPtr;
	typedef void* GameSessionPtr;
	typedef void* UnitSynchronizerPtr;
	typedef CApiMesh* MeshPtr;
	typedef void* JointPtr;
	typedef void* LodObjectPtr;
	typedef CApiLight* LightPtr;
	typedef void* VehiclePtr;
	typedef void* ClothPtr;
	typedef CApiLineObject* LineObjectPtr;
	typedef CApiGui* GuiPtr;
	typedef CApiQuaternion* QuaternionPtr;
	typedef CApiWindow* WindowPtr;
	typedef CApiNavigationMesh* NavigationMeshPtr;
	typedef CApiVideoPlayer* VideoPlayerPtr;
	typedef CApiReplay* ReplayPtr;
	typedef CApiCallbackData32* CallbackData32Ptr;
	typedef CApiStreamSource* StreamSourcePtr;
	typedef CApiTimpaniWorldInterface* TimpaniWorldInterfacePtr;
	typedef CApiGuiThumbnail* GuiThumbnailPtr;
	typedef CApiCaptureBuffer* CApiCaptureBufferPtr;

	typedef void* TransformComponentPtr;
	typedef void* MeshComponentPtr;
	typedef void* ActorComponentPtr;
	typedef void* SceneGraphComponentPtr;
	typedef void* AnimationBlenderComponentPtr;
	typedef void* AnimationStateMachineComponentPtr;
	typedef void* DebugNameComponentPtr;
	typedef void* DataComponentPtr;
	typedef void* RenderDataComponentPtr;
	typedef void* TagComponentPtr;
	typedef void* ComponentPtr;
	typedef CApiPhysicsWorld* PhysicsWorldPtr;

	typedef const CApiWorldConfig* ConstWorldConfigPtr;
	typedef const void* ConstConfigRootPtr;
	typedef const CApiMatrix4x4* ConstMatrix4x4Ptr;
	typedef const CApiVector2* ConstVector2Ptr;
	typedef const CApiVector3* ConstVector3Ptr;
	typedef const CApiVector4* ConstVector4Ptr;
	typedef const CApiLocalTransform* ConstLocalTransformPtr;
	typedef const CApiViewport* ConstViewportPtr;

	typedef const CApiShadingEnvironment* ConstShadingEnvironmentPtr;
	typedef const CApiWindow* ConstWindowPtr;
	typedef const CApiCamera* ConstCameraPtr;
	typedef const CApiWorld* ConstWorldPtr;
	typedef const CApiMaterial* ConstMaterialPtr;
	typedef const void* ConstRenderResourcePtr;
	typedef const void* ConstLanLobbyPtr;
	typedef const void* ConstLanLobbyBrowserPtr;
	typedef const CApiQuaternion* ConstQuaternionPtr;
	typedef const CApiLevel* ConstLevelPtr;
	typedef const void* ComponentApiPtr;
	typedef const CApiMesh* ConstMeshPtr;
	typedef const CApiNavigationMesh* ConstNavigationMeshPtr;
	typedef CApiMaterialData* MaterialDataPtr;

	typedef CApiUnitRef UnitRef;
	typedef unsigned ParticleRef;
	typedef unsigned GameObjectId;
	typedef uint64_t PeerId;
	typedef unsigned EntityRef;
	typedef CApiInstanceId InstanceId;
	typedef unsigned RaycastId;
	typedef unsigned SaveToken;
	typedef unsigned ScatterBrushId;
	typedef unsigned ScatterUnitId;
	typedef unsigned ScatterObserverId;

	struct WindowRectWrapper {
		int pos[4];
	};

	struct OOBBWrapper {
		float tm[16];
		float half_ext[3];
	};

	struct BoundingVolumeWrapper {
		CApiVector3 min;
		CApiVector3 max;
		float radius;
	};

	struct MoverFitsAtResult {
		int fits;
		CApiVector3 pos;
	};

	struct MoverSeparateResult {
		int is_colliding;
		int can_be_resolved;
		CApiVector3 position_after_resolving;
		ActorPtr collides_with; /* Can be nullptr even if is_colliding is true, not all collidables are actors. */
	};

	/*
		UINT_MAX represents a nil AnimationState value.
		Currently up to 32 states can be returned, use num_states to find out how many are.
	*/

	enum {MAX_ANIMATION_STATES = 32};
	struct AnimationStates {
		unsigned states[MAX_ANIMATION_STATES];
		unsigned num_states;
	};

	enum { MAX_ANIMATION_LAYER_SEEDS = 32 };
	struct AnimationLayerSeeds {
		unsigned seeds[MAX_ANIMATION_LAYER_SEEDS];
		unsigned num_seeds;
	};

	struct AnimationLayerInfo {
		float length;
		double t;
	};

	enum { MAX_ANIMATION_EVENT_PARAMETERS = 1 };
	enum { ANIMATION_EVENT_PERCENT_SYNC = 0 };

	struct AnimationEventParameters
	{
		unsigned n;
		unsigned keys[MAX_ANIMATION_EVENT_PARAMETERS];
		float values[MAX_ANIMATION_EVENT_PARAMETERS];
	};

	/*
	*	Specifies how units will be faded in/out when un-/spawned by the ScatterSystem
	*	POP - pop in place
	*	SLIDE_Z - slide in along object's z-axis
	*	SCALE - scale to full size
	*/
	enum ScatterFadeMethod {SCATTER_FADE_POP, SCATTER_FADE_SLIDE_Z, SCATTER_FADE_SCALE};

	/*
	*	Specifies how an animation should be blended with other animations.
	*	With BT_NORMAL the pose is lerped based on the blend strength.
	*	With BT_OFFSET the pose is applied as an offset.
	*/
	enum AnimationBlendType { ANIM_BT_NORMAL, ANIM_BT_OFFSET };

	enum WindowKeystrokes
	{
		WINDOW_KEYSTROKE_WINDOWS,
		WINDOW_KEYSTROKE_ALT_TAB,
		WINDOW_KEYSTROKE_ALT_ENTER,
		WINDOW_KEYSTROKE_ALT_F4,
	};

	/* Represents both the animation_root_mode and animation_bone_mode types since they are equal. */
	enum AnimationBoneRootMode
	{
		BRM_IGNORE					= 0,
		BRM_POSITION				= 1 << 0,
		BRM_ROTATION				= 1 << 1,
		BRM_SCALE					= 1 << 2,
		BRM_TRANSFORM				= BRM_POSITION | BRM_ROTATION | BRM_SCALE,
		BRM_POSITION_AND_ROTATION	= BRM_POSITION | BRM_ROTATION,
		BRM_POSITION_AND_SCALE		= BRM_POSITION | BRM_SCALE,
		BRM_ROTATION_AND_SCALE		= BRM_ROTATION | BRM_SCALE
	};

	/* Take note of the escape characters when reading. Example bone_names_list: "bone_hand_1\0bone_hand_2\0etc\0" */
	struct BoneNamesWrapper {
		const char* bone_names_list;
		unsigned num_bones;
	};

	enum RawInputEventType
	{
		BUTTON_PRESSED,
		BUTTON_RELEASED,

		AXIS_CHANGED,

		TOUCH_DOWN,
		TOUCH_UP,
		TOUCH_MOVE,
	};

	enum RawInputEventController
	{
		KEYBOARD,
		MOUSE,
		TOUCH_PANEL,
		GAMEPAD,
		PS4PAD
	};

	struct RawInputEventWrapper {
		CApiVector3 delta_value;
		unsigned char id;
		unsigned char controller_index;
		unsigned char type; /* RawInputEventType */
		unsigned char controller; /* RawInputEventController */
	};

	struct SocketAddressWrapper {
		char address_and_port[22];
	};

	enum RPCParameterType
	{
		RPC_PARAM_BOOL_TYPE,
		RPC_PARAM_INT_TYPE,
		RPC_PARAM_FLOAT_TYPE,
		RPC_PARAM_VECTOR3_TYPE,
		RPC_PARAM_QUATERNION_TYPE,
		RPC_PARAM_STRING_TYPE,
		RPC_PARAM_RESOURCE_ID_TYPE,
		RPC_PARAM_UINT_64_TYPE,
		RPC_PARAM_ARRAY_BEGINS,
		RPC_PARAM_ARRAY_ENDS
	};

	struct RPCMessageParameter
	{
		enum RPCParameterType type;
		void* data_pointer;
	};

	struct GameObjectField
	{
		unsigned field_name_id32;
		enum RPCParameterType type;
		void* data_pointer;
	};

	typedef void (*game_object_callback_function) (int id, uint64_t sending_peer);

	/*	These member functions will receive callbacks from the engine during NetworkCApi's update_receive.
		You're expected to assign all the function pointers before passing the struct. */
	struct RPCCallback {
		game_object_callback_function	game_object_created;
		game_object_callback_function	game_object_destroyed;
		game_object_callback_function	game_object_migrated_to_me;
		game_object_callback_function	game_object_migrated_away;
		void (*game_object_sync_done)	(uint64_t sending_peer);
		void (*game_session_disconnect)	(uint64_t sending_peer);
		/* Note: all data passed in the RPCMessageParameter array are temporary allocated and will get destroyed after the callback. */
		void (*custom_callback)			(uint64_t sending_peer, unsigned message_id32, struct RPCMessageParameter* parameter_array, unsigned num_parameters);
	};

	enum EntityCApi_EntityPropertyType
	{
		ENTITY_P_TYPE_NIL,
		ENTITY_P_TYPE_BOOL,
		ENTITY_P_TYPE_FLOAT,
		ENTITY_P_TYPE_STRING,
		ENTITY_P_TYPE_FLOAT_ARRAY
	};

	typedef struct EntityPropertyParameter
	{
		enum EntityCApi_EntityPropertyType type;
		void* data;

		/* num_elements will only be evaluated when passing array types. */
		unsigned num_elements;
	} EntityPropertyParameter;

	typedef struct EntityPropertyValue
	{
		/* num_elements will only be set when returning either an array type or to display string length. */
		unsigned num_elements;

		enum EntityCApi_EntityPropertyType type;
		char buffer[32];
	} EntityPropertyValue;

	enum RaycastType	{ RAY_TYPE_ANY, RAY_TYPE_CLOSEST, RAY_TYPE_ALL };
	enum ActorTemplate	{ ACTOR_T_STATIC = 1, ACTOR_T_DYNAMIC, ACTOR_T_BOTH };
	enum OverlapShape	{ OVERLAP_SPHERE, OVERLAP_AABB, OVERLAP_OOBB, OVERLAP_CAPSULE };

	struct CollisionHit
	{
		CApiVector3 position;
		CApiVector3 normal;
		float		distance;
		ActorPtr	actor;
	};

	enum SaveSystemError
	{
		SAVEDATA_ERROR_ERROR_MISSING,		/* The specified file does not exist. */
		SAVEDATA_ERROR_INVALID_FILENAME,	/* The specified filename is invalid. */
		SAVEDATA_ERROR_IO_ERROR,			/* A disk error occurred. */
		SAVEDATA_ERROR_BROKEN,				/* The saved data is corrupted. */
		SAVEDATA_ERROR_UNSUPPORTED_VERSION,	/* The data was saved using an old version, and cannot be loaded by this version. */
		SAVEDATA_ERROR_INVALID_TOKEN,		/* The specified token could not be found. */
		SAVEDATA_ERROR_NOT_DONE,			/* The specified token has not finished loading yet. */
		SAVEDATA_ERROR_NONE					/* No error occured. */
	};

	struct SaveSystemProgress
	{
		int is_done;
		float progress;
		enum SaveSystemError error_code;
	};

	enum SaveParameterType
	{
		SAVE_PARAM_TABLE_BEGIN,
		SAVE_PARAM_TABLE_END,
		SAVE_PARAM_NUMBER_FLOAT,
		SAVE_PARAM_STRING,
		SAVE_PARAM_BOOL,
		SAVE_PARAM_VECTOR3,
		SAVE_PARAM_VECTOR3_BOX,
		SAVE_PARAM_MATRIX4X4,
		SAVE_PARAM_MATRIX4X4_BOX,
		SAVE_PARAM_NUMBER_DOUBLE
	};

	struct SaveParameter
	{
		enum SaveParameterType type;
		void* data_pointer;
	};

	/* Note: You still have to close the token to free the data. */
	typedef void (*save_system_data_callback) (struct SaveParameter* parameter_array, unsigned num_parameters);

	/* Access the different null-terminated strings via s[i], i must be less than num_strings. The s must be pre-allocated by the user. */
	struct MultipleStringsBuffer
	{
		unsigned	num_strings;
		char**		s;
	};

	enum TimeStepPolicyType
	{
		TSP_FRAME_RATE,
		TSP_THROTTLE_FRAME_RATE,
		TSP_SMOOTHING,
		TSP_DEBT_PAYBACK,
		TSP_EXTERNAL_STEP_RANGE,
		TSP_EXTERNAL_MULTIPLIER,
		TSP_SYSTEM_STEP_RANGE,
		TSP_CLEAR_HISTORY,
		TSP_JUMP
	};

	struct TimeStepPolicyWrapper
	{
		enum TimeStepPolicyType type;

		union {
			int frames;
			int fps;
			float multiplier;
			float time;
			float min;
		};
		union {
			int outliers;
			float max;
		};
		union {
			float lerp;
		};
	};

	struct WindowOpenParameter
	{
		int x;
		int y;
		int width;
		int height;
		const char* optional_title;
		WindowPtr optional_parent;
		int explicit_resize;
		int main_window;
		int visible;
		int pass_key_events_to_parent;
		int layered;
	};

	struct Vector3ArrayWrapper
	{
		int count;
		CApiVector3* v;
	};

	enum ReplayRecordMode
	{
		REPLAY_RECORD_MODE_DISABLED,
		REPLAY_RECORD_MODE_TRANSFORM,
		REPLAY_RECORD_MODE_SCENE_GRAPH
	};

	struct MaterialDecalDrawer {
		unsigned material_id32;
		unsigned drawer_id32;
	};

#ifdef __cplusplus
};
#endif
