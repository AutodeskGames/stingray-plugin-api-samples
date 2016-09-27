#pragma once

#ifdef __cplusplus
extern "C" {
#endif

typedef struct CApiUnit CApiUnit;
typedef struct CApiWindow CApiWindow;
typedef struct CApiWorld CApiWorld;
typedef struct CApiLevel CApiLevel;
typedef struct CApiActor CApiActor;
typedef struct CApiMover CApiMover;
typedef struct CApiCamera CApiCamera;
typedef struct CApiViewport CApiViewport;
typedef struct CApiLight CApiLight;
typedef struct CApiMaterial CApiMaterial;
typedef struct CApiMesh CApiMesh;
typedef struct CApiShadingEnvironment CApiShadingEnvironment;
typedef struct CApiNavigationMesh CApiNavigationMesh;
typedef struct CApiPhysicsWorld CApiPhysicsWorld;
typedef struct CApiLineObject CApiLineObject;
typedef struct CApiGui CApiGui;
typedef struct CApiStoryTeller CApiStoryTeller;
typedef struct CApiVideoPlayer CApiVideoPlayer;
typedef struct CApiReplay CApiReplay;
typedef struct CApiVectorField CApiVectorField;
typedef struct CApiScatterSystem CApiScatterSystem;

typedef unsigned CApiUnitRef;
typedef unsigned CApiInstanceId;

typedef struct CApiVector2
{
	union { float x; float u; };
	union { float y; float v; };
} CApiVector2;

typedef struct CApiVector3
{
	float x, y, z;
} CApiVector3;

typedef struct CApiVector4
{
	float x, y, z, w;
} CApiVector4;

typedef struct CApiQuaternion
{
	float x,y,z,w;
} CApiQuaternion;

typedef struct CApiMatrix3x3
{
	CApiVector3 x, y, z;
} CApiMatrix3x3;

typedef struct CApiMatrix4x4
{
	float v[16];
} CApiMatrix4x4;

typedef struct CApiTransform
{
	CApiQuaternion q;
	CApiVector3 p;
} CApiTransform;

typedef struct CApiLocalTransform
{
	CApiMatrix3x3 rot;
	CApiVector3 pos;
	CApiVector3 scale;
	float dummy; // Force 16 byte alignment
} CApiLocalTransform;

typedef struct CApiPhysicsWorldSettings
{
	char apex_cloth;
	float apex_lod_resource_budget;

	int step_frequency;
	int max_substeps;
	char async_timestep;
	char swept_integration;
} CApiPhysicsWorldSettings;

typedef struct CApiWorldConfig {
	char disable_physics;
	char disable_sound;
	char disable_rendering;
	char enable_replay;
	CApiPhysicsWorldSettings physics_world_settings;
	unsigned long long decals;
} CApiWorldConfig;

typedef void (*CApiCallbackFunction)(const void*);

typedef struct CApiCallbackData32 {
	char _data[32];
} CApiCallbackData32;

#ifdef __cplusplus
}
#endif
