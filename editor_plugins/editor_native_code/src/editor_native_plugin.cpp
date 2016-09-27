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

	void *EditorTestPlugin::config_data_reallocator(void *ud, void *ptr, int osize, int nsize, const char *file, int line)
	{
		if (nsize == 0) {
			free(ptr);
			return nullptr;
		}
		auto *nptr = realloc(ptr, nsize);
		return nptr;
	}

	cd_loc EditorTestPlugin::copy_config_data_value(ConfigData *orig_cd, cd_loc orig_loc, ConfigData *new_cd)
	{
		auto type = _cd_api->type(orig_cd, orig_loc);
		switch(type) {
		case CD_TYPE_NULL: return _cd_api->null();
		case CD_TYPE_UNDEFINED: return _cd_api->undefined();
		case CD_TYPE_FALSE: return _cd_api->false_value();
		case CD_TYPE_TRUE: return _cd_api->true_value();
		case CD_TYPE_NUMBER: return _cd_api->add_number(&new_cd, _cd_api->to_number(orig_cd, orig_loc));
		case CD_TYPE_STRING: return _cd_api->add_string(&new_cd, _cd_api->to_string(orig_cd, orig_loc));
		case CD_TYPE_ARRAY: {
			auto length = _cd_api->array_size(orig_cd, orig_loc);
			auto new_arr_loc = _cd_api->add_array(&new_cd, length);
			for (auto i = 0; i < length; ++i) {
				auto array_item_loc = _cd_api->array_item(orig_cd, orig_loc, i);
				_cd_api->push(&new_cd, new_arr_loc, copy_config_data_value(orig_cd, array_item_loc, new_cd));
			}
			return new_arr_loc;
		}
		case CD_TYPE_OBJECT: {
			auto size = _cd_api->object_size(orig_cd, orig_loc);
			auto new_object_loc = _cd_api->add_object(&new_cd, size);
			for (auto i = 0; i < size; ++i) {
				auto object_item_key = _cd_api->object_key(orig_cd, orig_loc, i);
				auto object_item_value = _cd_api->object_value(orig_cd, orig_loc, i);
				_cd_api->set(&new_cd, new_object_loc, object_item_key, copy_config_data_value(orig_cd, object_item_value, new_cd));
			}
			return new_object_loc;
		}
		default: return -1;
		}
	}

	void EditorTestPlugin::plugin_loaded(GetEditorApiFunction get_editor_api)
	{
		_api = static_cast<EditorApi*>(get_editor_api(EDITOR_PLUGIN_API_ID));

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

		auto api_v2 = static_cast<EditorApi_V2*>(get_editor_api(EDITOR_PLUGIN_API_V2_ID));
		api_v2->register_native_function("editorNativeTest", "test_api_v2", &EditorTestPlugin::test_api_v2);

		// Test api v3
		auto api_v3 = static_cast<EditorApi_V3*>(get_editor_api(EDITOR_PLUGIN_API_V3_ID));
		api_v3->register_native_function("editorNativeTest", "test_api_v3", [=](ConfigData** args, int num) -> ConfigData* {
			auto logging_api = static_cast<EditorLoggingApi*>(get_editor_api(EDITOR_LOGGING_API_ID));
			logging_api->info("Successfully fetched api with editor api v3");
			return nullptr;
		});
	}

	const char* EditorTestPlugin::get_name()
	{
		return "Editor Native Plugin Test";
	}

	const char* EditorTestPlugin::get_version()
	{
		return "1.0.0.0";
	}

	void EditorTestPlugin::shutdown(GetEditorApiFunction get_editor_api)
	{
		auto api_v2 = static_cast<EditorApi_V2*>(get_editor_api(EDITOR_PLUGIN_API_V2_ID));
		auto api_v3 = static_cast<EditorApi_V3*>(get_editor_api(EDITOR_PLUGIN_API_V3_ID));

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

	// Every arguments are owned by the editor and will be destroyed when the function returns.
	// All data returned is now owned by the editor.
	ConfigData* EditorTestPlugin::test(ConfigData **args, int num)
	{
		if (num == 0)
			return nullptr;

		auto cd = _cd_api->make(config_data_reallocator, nullptr, 0, 0);
		auto arr = _cd_api->add_array(&cd, num);
		_cd_api->set_root(cd, arr);

		for (auto i = 0; i < num; ++i) {
			auto argument = args[i];
			auto copy = copy_config_data_value(argument, _cd_api->root(argument), cd);
			_cd_api->push(&cd, arr, copy);
		}

		return cd;
	}

	ConfigData* EditorTestPlugin::get_static_handle(ConfigData** args, int num)
	{
		auto cd = _cd_api->make(config_data_reallocator, nullptr, 0, 0);
		auto handle_loc = _cd_api->add_handle(&cd, &random_bits_of_data, nullptr);
		_cd_api->set_root(cd, handle_loc);
		return cd;
	}

	ConfigData* EditorTestPlugin::test_static_handle(ConfigData** args, int num)
	{
		auto cd = _cd_api->make(config_data_reallocator, nullptr, 0, 0);
		_cd_api->set_root(cd, _cd_api->false_value());

		if (num != 1)
			return cd;

		auto handle_cd = args[0];
		auto handle_loc = _cd_api->root(handle_cd);
		auto type = _cd_api->type(handle_cd, handle_loc);
		if (type != CD_TYPE_HANDLE)
			return cd;

		auto handle = static_cast<RandomObject*>(_cd_api->to_handle(handle_cd, handle_loc));
		if (handle == nullptr)
			return cd;

		if (handle != &random_bits_of_data)
			return cd;

		if (handle->val1() != random_bits_of_data.val1() || handle->val2() != random_bits_of_data.val2())
			return cd;

		_cd_api->set_root(cd, _cd_api->true_value());
		return cd;
	}

	ConfigData* EditorTestPlugin::get_dynamic_handle(ConfigData** args, int num)
	{
		auto cd = _cd_api->make(config_data_reallocator, nullptr, 0, 0);
		_dynamic_random_object = new RandomObject("Dynamic object", 12345);
		auto handle_loc = _cd_api->add_handle(&cd, _dynamic_random_object, &EditorTestPlugin::delete_dynamic_handle);
		_cd_api->set_root(cd, handle_loc);
		return cd;
	}

	ConfigData* EditorTestPlugin::test_dynamic_handle(ConfigData** args, int num)
	{
		auto cd = _cd_api->make(config_data_reallocator, nullptr, 0, 0);
		_cd_api->set_root(cd, _cd_api->false_value());

		if (num != 1)
			return cd;

		auto handle_cd = args[0];
		auto handle_loc = _cd_api->root(handle_cd);
		auto type = _cd_api->type(handle_cd, handle_loc);
		if (type != CD_TYPE_HANDLE)
			return cd;

		auto handle = static_cast<RandomObject*>(_cd_api->to_handle(handle_cd, handle_loc));
		if (handle == nullptr)
			return cd;

		if (handle != _dynamic_random_object)
			return cd;

		if (handle->val1() != _dynamic_random_object->val1() || handle->val2() != _dynamic_random_object->val2())
			return cd;

		_cd_api->set_root(cd, _cd_api->true_value());
		return cd;
	}

	void EditorTestPlugin::delete_dynamic_handle(void* handle)
	{
		auto random_object = static_cast<RandomObject*>(handle);
		if (random_object != nullptr)
			delete random_object;
		else
			printf("Handle is not the correct object");
	}

	ConfigData* EditorTestPlugin::test_logging(ConfigData** args, int num)
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

	ConfigData* EditorTestPlugin::test_eval(ConfigData** args, int num)
	{
		auto retval = _cd_api->make(config_data_reallocator, nullptr, 0, 0);
		auto exception = _cd_api->make(config_data_reallocator, nullptr, 0, 0);
		auto success = _eval_api->eval("console.warn('Should print this warning in the console');", retval, exception);
		if (!success) {
			auto message = _cd_api->to_string(exception, _cd_api->object_value(exception, _cd_api->root(exception), 0));
			_logging_api->error(message);
		}

		success = _eval_api->eval("throw new Error('Hello Error!');", retval, exception);
		if (success) {
			_logging_api->error("Should have thrown an error");
		} else {
			auto message = _cd_api->to_string(exception, _cd_api->object_value(exception, _cd_api->root(exception), 0));
			_logging_api->warning("Successfully generated an exception");
			_logging_api->warning(message);
		}

		_cd_api->free(retval);
		_cd_api->free(exception);
		return nullptr;
	}

	ConfigData* EditorTestPlugin::test_api_v2(ConfigData** args, int num, GetEditorApiFunction get_editor_api)
	{
		auto logging_api = static_cast<EditorLoggingApi*>(get_editor_api(EDITOR_LOGGING_API_ID));
		logging_api->info("Successfully fetched api with editor api v2");

		return nullptr;
	}


}

extern "C" {
#if defined (STATIC_LINKING)
void *get_editor_plugin_api(unsigned api)
#else
__declspec(dllexport) void *get_editor_plugin_api(unsigned api)
#endif
{
	if (api == EDITOR_PLUGIN_API_ID) {
		static struct EditorPluginApi editor_api = {nullptr};
		editor_api.plugin_loaded = &PLUGIN_NAMESPACE::EditorTestPlugin::plugin_loaded;
		editor_api.get_name = &PLUGIN_NAMESPACE::EditorTestPlugin::get_name;
		editor_api.get_version= &PLUGIN_NAMESPACE::EditorTestPlugin::get_version;
		editor_api.shutdown = &PLUGIN_NAMESPACE::EditorTestPlugin::shutdown;
		return &editor_api;
	}
	return nullptr;
}
}
