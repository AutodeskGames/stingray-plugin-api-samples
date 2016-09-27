#pragma once

#include <functional>

#include <editor_plugin_api/editor_plugin_api.h>
#include <string>

namespace PLUGIN_NAMESPACE
{
	class RandomObject
	{
	public:
		RandomObject(const std::string &val1, int val2)
			: _val1(val1)
			, _val2(val2)
		{}

		const std::string& val1() const {return _val1;}
		int val2() const {return _val2;}

	private:
		std::string _val1;
		int _val2;
	};

	class EditorTestPlugin
	{
	public:
		static void plugin_loaded(GetEditorApiFunction get_editor_api);
		static const char* get_name();
		static const char* get_version();
		static void shutdown(GetEditorApiFunction get_editor_api);

		// Function to test arguments and result passing.
		static ConfigData* test(ConfigData **args, int num);

		// Functions to test handles without deallocator
		static ConfigData *get_static_handle(ConfigData **args, int num);
		static ConfigData *test_static_handle(ConfigData **args, int num);

		// Functions to test handles that rely on a deallocator, i.e. will be destroyed when the javascript object is garbage collected
		static ConfigData *get_dynamic_handle(ConfigData **args, int num);
		static ConfigData *test_dynamic_handle(ConfigData **args, int num);
		static void delete_dynamic_handle(void *handle);

		// Test logging api
		static ConfigData* test_logging(ConfigData **args, int num);

		// Test eval api
		static ConfigData* test_eval(ConfigData **args, int num);

		// Test editor api v2
		static ConfigData* test_api_v2(ConfigData **args, int num, GetEditorApiFunction get_editor_api);

	private:
		static void *config_data_reallocator(void *ud, void *ptr, int osize, int nsize, const char *file, int line);
		static cd_loc copy_config_data_value(ConfigData *orig_cd, cd_loc orig_loc, ConfigData *new_cd);

		static EditorApi *_api;
		static ConfigDataApi *_cd_api;
		static EditorLoggingApi *_logging_api;
		static EditorEvalApi *_eval_api;
		static RandomObject *_dynamic_random_object;
	};
}
