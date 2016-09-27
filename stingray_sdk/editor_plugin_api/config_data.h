// nf_config_data.c
#pragma once

struct ConfigData;

enum {
	CD_TYPE_NULL, CD_TYPE_FALSE, CD_TYPE_TRUE, CD_TYPE_NUMBER, CD_TYPE_STRING,
	CD_TYPE_ARRAY, CD_TYPE_OBJECT, CD_TYPE_UNDEFINED, CD_TYPE_HANDLE
};

typedef int cd_loc;
typedef void * (*cd_realloc) (void *ud, void *ptr, int osize, int nsize, const char *file, int line);
typedef void (*cd_handle_dealloc)(void *handle);
