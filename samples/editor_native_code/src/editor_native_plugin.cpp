#include "editor_native_plugin.h"
#include <cstdio>

namespace PLUGIN_NAMESPACE
{
	RandomObject random_bits_of_data("Test string", 42);
	EditorApi* EditorTestPlugin::_api = nullptr;
	ConfigDataApi* EditorTestPlugin::_cd_api = nullptr;
	EditorLoggingApi* EditorTestPlugin::_logging_api = nullptr;
	EditorEvalApi* EditorTestPlugin::_eval_api = nullptr;
	RandomObject* EditorTestPlugin::_dynamic_random_object = nullptr;
	
	ConfigValue EditorTestPlugin::copy_config_data_value(ConfigValue orig_cv, ConfigValue new_cv)
	{
		auto type = _cd_api->type(orig_cv);
		switch(type) {
			case CD_TYPE_NULL: return _cd_api->nil();
			case CD_TYPE_FALSE: _cd_api->set_bool(new_cv, false); break;
			case CD_TYPE_TRUE: _cd_api->set_bool(new_cv, true); break;
			case CD_TYPE_NUMBER: _cd_api->set_number(new_cv, _cd_api->to_number(orig_cv)); break;
			case CD_TYPE_STRING: _cd_api->set_string(new_cv, _cd_api->to_string(orig_cv)); break;
			case CD_TYPE_ARRAY:
			{
				auto length = _cd_api->array_size(orig_cv);
				for (auto i = 0; i < length; ++i) {
					auto origin_item = _cd_api->array_item(orig_cv, i);
					_cd_api->push(new_cv, origin_item);
				}
				break;
			}
			case CD_TYPE_OBJECT:
			{
				auto size = _cd_api->object_size(orig_cv);
				_cd_api->set_object(new_cv);
				for (auto i = 0; i < size; ++i) {
					auto object_item_key = _cd_api->object_key(orig_cv, i);
					auto object_item_value = _cd_api->object_value(orig_cv, i);
					_cd_api->set(new_cv, object_item_key, object_item_value);
				}
				break;
			}
			default: break;
		}

		return new_cv;
	}

	void EditorTestPlugin::plugin_loaded(GetEditorApiFunction get_editor_api)
	{
		_api = static_cast<EditorApi*>(get_editor_api(EDITOR_API_ID));

		auto registered = _api->register_native_function("editorNativeTest", "test", &EditorTestPlugin::test);
		registered = registered && _api->register_native_function("editorNativeTest", "get_static_handle", &EditorTestPlugin::get_static_handle);
		registered = registered && _api->register_native_function("editorNativeTest", "test_static_handle", &EditorTestPlugin::test_static_handle);
		registered = registered && _api->register_native_function("editorNativeTest", "get_dynamic_handle", &EditorTestPlugin::get_dynamic_handle);
		registered = registered && _api->register_native_function("editorNativeTest", "test_dynamic_handle", &EditorTestPlugin::test_dynamic_handle);
		registered = registered && _api->register_native_function("editorNativeTest", "test_logging", &EditorTestPlugin::test_logging);
		registered = registered && _api->register_native_function("editorNativeTest", "test_eval", &EditorTestPlugin::test_eval);
		if (!registered) {
			printf("Error registering functions.");
		}

		_cd_api = static_cast<ConfigDataApi*>(get_editor_api(CONFIGDATA_API_ID));
		_logging_api = static_cast<EditorLoggingApi*>(get_editor_api(EDITOR_LOGGING_API_ID));
		_eval_api = static_cast<EditorEvalApi*>(get_editor_api(EDITOR_EVAL_API_ID));

		auto api_v2 = static_cast<EditorApi_V2*>(get_editor_api(EDITOR_API_V2_ID));
		api_v2->register_native_function("editorNativeTest", "test_api_v2", &EditorTestPlugin::test_api_v2);

		// Test api v3
		auto api_v3 = static_cast<EditorApi_V3*>(get_editor_api(EDITOR_API_V3_ID));
		api_v3->register_native_function("editorNativeTest", "test_api_v3", [=](ConfigValueArgs args, int num) -> ConfigValue {
			auto logging_api = static_cast<EditorLoggingApi*>(get_editor_api(EDITOR_LOGGING_API_ID));
			logging_api->info("Successfully fetched api with editor api v3");
			return nullptr;
		});
	}

	void EditorTestPlugin::plugin_loaded_async(GetEditorApiFunction get_editor_api)
	{
		_cd_api = static_cast<ConfigDataApi*>(get_editor_api(CONFIGDATA_API_ID));
		_logging_api = static_cast<EditorLoggingApi*>(get_editor_api(EDITOR_LOGGING_API_ID));
		_eval_api = static_cast<EditorEvalApi*>(get_editor_api(EDITOR_EVAL_API_ID));

		auto async_api = static_cast<EditorAsyncApi*>(get_editor_api(EDITOR_ASYNC_API_ID));
		async_api->register_async_function("test_query", &EditorTestPlugin::test_query_api);
	}

	const char* EditorTestPlugin::get_name()
	{
		return "Editor Native Plugin Test";
	}

	const char* EditorTestPlugin::get_version()
	{
		return "1.1.0.0";
	}

	void EditorTestPlugin::shutdown(GetEditorApiFunction get_editor_api)
	{
		auto api_v2 = static_cast<EditorApi_V2*>(get_editor_api(EDITOR_API_V2_ID));
		auto api_v3 = static_cast<EditorApi_V3*>(get_editor_api(EDITOR_API_V3_ID));

		auto unregistered = _api->unregister_native_function("editorNativeTest", "test");
		unregistered = unregistered && _api->unregister_native_function("editorNativeTest", "get_static_handle");
		unregistered = unregistered && _api->unregister_native_function("editorNativeTest", "test_static_handle");
		unregistered = unregistered && _api->unregister_native_function("editorNativeTest", "get_dynamic_handle");
		unregistered = unregistered && _api->unregister_native_function("editorNativeTest", "test_dynamic_handle");
		unregistered = unregistered && _api->unregister_native_function("editorNativeTest", "test_logging");
		unregistered = unregistered && _api->unregister_native_function("editorNativeTest", "test_eval");
		unregistered = unregistered && api_v2->unregister_native_function("editorNativeTest", "test_api_v2");
		unregistered = unregistered && api_v3->unregister_native_function("editorNativeTest", "test_api_v3");
		if (!unregistered) {
			printf("Error unregistering functions.");
		}
	}

	void EditorTestPlugin::shutdown_async(GetEditorApiFunction get_editor_api)
	{
		auto async_api = static_cast<EditorAsyncApi*>(get_editor_api(EDITOR_ASYNC_API_ID));
		async_api->unregister_async_function("test_query");
	}

	// Every arguments are owned by the editor and will be destroyed when the function returns.
	// All data returned is now owned by the editor.
	ConfigValue EditorTestPlugin::test(ConfigValueArgs args, int num)
	{
		if (num == 0)
			return nullptr;

		auto cv = _cd_api->make(nullptr);
		for (auto i = 0; i < num; ++i) {
			auto argument = &args[i];
			auto new_arg = _cd_api->push(cv, nullptr);
			copy_config_data_value(argument, new_arg);
		}

		return cv;
	}

	ConfigValue EditorTestPlugin::get_static_handle(ConfigValueArgs args, int num)
	{
		auto cv = _cd_api->make(nullptr);
		_cd_api->set_handle(cv, (ConfigHandle)&random_bits_of_data, nullptr);
		return cv;
	}

	ConfigValue EditorTestPlugin::test_static_handle(ConfigValueArgs args, int num)
	{
		auto cv = _cd_api->make(nullptr);
		_cd_api->set_bool(cv, false);

		if (num != 1)
			return cv;

		auto handle_cv = &args[0];
		auto type = _cd_api->type(handle_cv);
		if (type != CD_TYPE_HANDLE)
			return cv;

		auto handle = reinterpret_cast<RandomObject*>(_cd_api->to_handle(handle_cv));
		if (handle == nullptr)
			return cv;

		if (handle != &random_bits_of_data)
			return cv;

		if (handle->val1() != random_bits_of_data.val1() || handle->val2() != random_bits_of_data.val2())
			return cv;

		_cd_api->set_bool(cv, true);
		return cv;
	}

	ConfigValue EditorTestPlugin::get_dynamic_handle(ConfigValueArgs args, int num)
	{
		auto cv = _cd_api->make(nullptr);
		_dynamic_random_object = new RandomObject("Dynamic object", 12345);
		_cd_api->set_handle(cv, (ConfigHandle)_dynamic_random_object, (cd_handle_dealloc)&EditorTestPlugin::delete_dynamic_handle);
		return cv;
	}

	ConfigValue EditorTestPlugin::test_dynamic_handle(ConfigValueArgs args, int num)
	{
		auto cv = _cd_api->make(nullptr);
		_cd_api->set_bool(cv, false);

		if (num != 1)
			return cv;

		auto handle_cv = &args[0];
		auto type = _cd_api->type(handle_cv);
		if (type != CD_TYPE_HANDLE)
			return cv;

		auto handle = reinterpret_cast<RandomObject*>(_cd_api->to_handle(handle_cv));
		if (handle == nullptr)
			return cv;

		if (handle != _dynamic_random_object)
			return cv;

		if (handle->val1() != _dynamic_random_object->val1() || handle->val2() != _dynamic_random_object->val2())
			return cv;

		_cd_api->set_bool(cv, true);
		return cv;
	}

	void EditorTestPlugin::delete_dynamic_handle(void* handle)
	{
		auto random_object = static_cast<RandomObject*>(handle);
		if (random_object != nullptr)
			delete random_object;
		else
			printf("Handle is not the correct object");
	}

	ConfigValue EditorTestPlugin::test_logging(ConfigValueArgs args, int num)
	{
		_logging_api->debug("Should print this in the dev tools only.");
		_logging_api->info("Should print this info");
		_logging_api->warning("Should print this warning");
		_logging_api->error("Should print this error");

		try {
			throw std::exception("Test catch exception");
		}
		catch (std::exception err) {
			_logging_api->error(err.what());
		}

		return nullptr;
	}

	ConfigValue EditorTestPlugin::test_eval(ConfigValueArgs args, int num)
	{
		auto retval = _cd_api->make(nullptr);
		auto exception = _cd_api->make(nullptr);
		auto success = _eval_api->eval("console.warn('Should print this warning in the console');", retval, exception);
		if (!success) {
			auto message = _cd_api->to_string(exception);
			_logging_api->error(message);
		}

		success = _eval_api->eval("throw new Error('Hello Error!');", retval, exception);
		if (success) {
			_logging_api->error("Should have thrown an error");
		} else {
			bool is_expcetion_string = _cd_api->type(exception) == CD_TYPE_STRING;
			auto message = is_expcetion_string ? _cd_api->to_string(exception) : _cd_api->to_string(_cd_api->object_lookup(exception, "message"));
			_logging_api->warning("Successfully generated an exception");
			_logging_api->warning(message);
		}

		_cd_api->free(retval);
		_cd_api->free(exception);
		return nullptr;
	}

	ConfigValue EditorTestPlugin::test_api_v2(ConfigValueArgs args, int num, GetEditorApiFunction get_editor_api)
	{
		auto logging_api = static_cast<EditorLoggingApi*>(get_editor_api(EDITOR_LOGGING_API_ID));
		logging_api->info("Successfully fetched api with editor api v2");

		return nullptr;
	}

	ConfigValue EditorTestPlugin::test_query_api(ConfigValueArgs args, int num, GetEditorApiFunction get_editor_api)
	{
		if (num == 0)
			return nullptr;

		auto cd_api = static_cast<ConfigDataApi*>(get_editor_api(CONFIGDATA_API_ID));

		auto cv = cd_api->make(nullptr);
		for (auto i = 0; i < num; ++i) {
			auto argument = &args[i];
			cd_api->push(cv, argument);
		}

		return cv;
	}

}

extern "C" {
#if defined (STATIC_LINKING)
void *get_editor_plugin_api(unsigned api)
#else
__declspec(dllexport) void *get_editor_plugin_api(unsigned api)
#endif
{
	if (api == EDITOR_PLUGIN_SYNC_API_ID) {
		static struct EditorPluginSyncApi editor_api = {nullptr};
		editor_api.plugin_loaded = &PLUGIN_NAMESPACE::EditorTestPlugin::plugin_loaded;
		editor_api.get_name = &PLUGIN_NAMESPACE::EditorTestPlugin::get_name;
		editor_api.get_version= &PLUGIN_NAMESPACE::EditorTestPlugin::get_version;
		editor_api.shutdown = &PLUGIN_NAMESPACE::EditorTestPlugin::shutdown;
		return &editor_api;
	}

	if (api == EDITOR_PLUGIN_ASYNC_API_ID) {
		static struct EditorPluginAsyncApi editor_api = {nullptr};
		editor_api.plugin_loaded = &PLUGIN_NAMESPACE::EditorTestPlugin::plugin_loaded_async;
		editor_api.get_name = &PLUGIN_NAMESPACE::EditorTestPlugin::get_name;
		editor_api.get_version= &PLUGIN_NAMESPACE::EditorTestPlugin::get_version;
		editor_api.shutdown = &PLUGIN_NAMESPACE::EditorTestPlugin::shutdown_async;
		return &editor_api;
	}

	return nullptr;
}
}
