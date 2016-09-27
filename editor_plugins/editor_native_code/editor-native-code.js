define([
    'app',
    'stingray',
    'lodash',
    'common/file-system-utils',
    'services/plugin-service'
], function (app, stingray, _, fileUtils, pluginService) {
    'use strict';

    app.service('plugin', function () {
        this.promise = pluginService.getPlugin('editor-native-code').then(function (pluginInfo) {
            this.info = pluginInfo;
        }.bind(this));
    });

    app.controller('editorNativeCode', function ($scope, plugin) {
        $scope.pluginLoaded = false;
        let path = fileUtils.join(plugin.info.$dir, '\\src\\x64\\Debug\\editor_native_plugin.dll');
        let pluginId = '';

        function functionIsLoaded(namespace, name) {
            if (!window[namespace] || !window[namespace][name]) {
                console.error('Function ' + name + ' not loaded');
                return false;
            }
            return true;
        }

        $scope.load = function () {
            let id = stingray.loadNativeExtension(path);
            console.warn('Loaded plugin ' + id);
            pluginId = id;
            $scope.pluginLoaded = true;
        };

        $scope.unload = function () {
            stingray.unloadNativeExtension(pluginId);
            console.warn('Plugin ' + pluginId + ' unloaded!');
            pluginId = '';
            $scope.pluginLoaded = false;
        };

        $scope.test = function () {
            function testArgs() {
                let args = Array.prototype.slice.call(arguments, 0);
                let result = window.editorNativeTest.test.apply(window.editorNativeTest, args);

                if (args.length === 0) {
                    if (result !== undefined) {
                        console.error('Expected undefined but got ' + JSON.stringify(result) + ' instead.');
                        return false;
                    }
                    return true;
                }

                if (args.length !== result.length) {
                    console.error('Send ' + args.length + ' arguments but received ' + result.length + ' values instead.', JSON.stringify(result));
                    return false;
                }

                let success = true;
                for (let i = 0; i < args.length; ++i) {
                    if (!_.isEqual(result[i], args[i])) {
                        console.error('Argument ' + i + ': expected ' + JSON.stringify(args[i]) + ' but received ' + JSON.stringify(result[i]));
                        success = false;
                    }
                }

                return success;
            }

            if (!functionIsLoaded('editorNativeTest', 'test')) {
                return;
            }

            let success = true;
            success = success && testArgs();
            success = success && testArgs(undefined);
            success = success && testArgs(false);
            success = success && testArgs(true);
            success = success && testArgs(1);
            success = success && testArgs(3.14159);
            success = success && testArgs(null);
            success = success && testArgs('test');
            success = success && testArgs([1, 2, 3]);
            success = success && testArgs({name: 'Bob', age: 42});
            success = success && testArgs([1, [2, 3], {index: 4}]);
            success = success && testArgs({name: 'Bob', age: 42, values: [9,4,32, {innerValue: 'foo'}]});
            success = success && testArgs(null, 1, 3.14159, 'test', [1,2,3,4], {name: 'Bob', age: 42});

            if (success) {
                console.warn('All tests passed');
            } else {
                console.warn('Tests failed.');
            }
        };

        $scope.testHandle = function () {
            if (!functionIsLoaded('editorNativeTest', 'get_static_handle')) {
                return;
            }

            if (!functionIsLoaded('editorNativeTest', 'test_static_handle')) {
                return;
            }

            if (!functionIsLoaded('editorNativeTest', 'get_dynamic_handle')) {
                return;
            }

            if (!functionIsLoaded('editorNativeTest', 'test_dynamic_handle')) {
                return;
            }

            let handleObject = window.editorNativeTest.get_static_handle();
            let success = window.editorNativeTest.test_static_handle(handleObject);

            let dynamicHandleObject = window.editorNativeTest.get_dynamic_handle();
            success = success && window.editorNativeTest.test_dynamic_handle(dynamicHandleObject);
            //console.warn('Handle test ' + success ? 'passed!' : 'failed!');
            if (success)
                console.warn('Handle test passed!');
            else
                console.warn('Handle test failed!');
        };

        $scope.testLogging = function () {
            if (!functionIsLoaded('editorNativeTest', 'test_logging')) {
                return;
            }

            window.editorNativeTest.test_logging();
        };

        $scope.testEval = function () {
            if (!functionIsLoaded('editorNativeTest', 'test_eval')) {
                return;
            }

            window.editorNativeTest.test_eval();
        };

        $scope.testApiV2 = function () {
            if (!functionIsLoaded('editorNativeTest', 'test_api_v2')) {
                return;
            }

            window.editorNativeTest.test_api_v2();
        };

        $scope.testApiV3 = function () {
            if (!functionIsLoaded('editorNativeTest', 'test_api_v3')) {
                return;
            }

            window.editorNativeTest.test_api_v3();
        };
    });
});
