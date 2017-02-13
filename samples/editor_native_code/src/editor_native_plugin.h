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
		static void plugin_loaded_async(GetEditorApiFunction get_editor_api);
		static const char* get_name();
		static const char* get_version();
		static void shutdown(GetEditorApiFunction get_editor_api);
		static void shutdown_async(GetEditorApiFunction get_editor_api);

		// Function to test arguments and result passing.
		static ConfigValue test(ConfigValueArgs args, int num);

		// Functions to test handles without deallocator
		static ConfigValue get_static_handle(ConfigValueArgs args, int num);
		static ConfigValue test_static_handle(ConfigValueArgs args, int num);

		// Functions to test handles that rely on a deallocator, i.e. will be destroyed when the javascript object is garbage collected
		static ConfigValue get_dynamic_handle(ConfigValueArgs args, int num);
		static ConfigValue test_dynamic_handle(ConfigValueArgs args, int num);
		static void delete_dynamic_handle(void *handle);

		// Test logging api
		static ConfigValue test_logging(ConfigValueArgs args, int num);

		// Test eval api
		static ConfigValue test_eval(ConfigValueArgs args, int num);

		// Test editor api v2
		static ConfigValue test_api_v2(ConfigValueArgs args, int num, GetEditorApiFunction get_editor_api);

		// Test query api
		static ConfigValue test_query_api(ConfigValueArgs args, int num, GetEditorApiFunction get_editor_api);

	private:
		static void *config_data_reallocator(void *ud, void *ptr, int osize, int nsize, const char *file, int line);
		static ConfigValue copy_config_data_value(ConfigValue orig_cd, ConfigValue new_cd);

		static EditorApi *_api;
		static ConfigDataApi *_cd_api;
		static EditorLoggingApi *_logging_api;
		static EditorEvalApi *_eval_api;
		static RandomObject *_dynamic_random_object;
	};
}
