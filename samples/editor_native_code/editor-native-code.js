define([
    'app',
    'stingray',
    'lodash',
    'common/math-utils',
    'common/file-system-utils',
    'services/plugin-service'
], function (app, stingray, _, mathUtils, fileUtils, pluginService) {
    'use strict';

    app.service('plugin', function () {
        this.promise = pluginService.getPlugin('editor-native-code').then(function (pluginInfo) {
            this.info = pluginInfo;
        }.bind(this));
    });

    app.controller('editorNativeCode', function ($scope, plugin) {
        $scope.pluginLoaded = false;
        $scope.pluginAsyncLoaded = false;
        let path = fileUtils.join(plugin.info.$dir, '\\build\\vc14\\win64\\Debug\\editor_native_code_w64_debug.dll');
        let pluginId = '';
        let pluginAsyncId = '';

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

        $scope.loadAsync = function () {
            stingray.loadAsyncExtension(path).then(function (id) {
                console.warn('Loaded async plugin ' + id);
                pluginAsyncId = id;
                $scope.digest(function () {
                    $scope.pluginAsyncLoaded = true;
                });
            });
        };

        $scope.unloadAsync = function () {
            stingray.unloadAsyncExtension(pluginAsyncId).then(function () {
                console.warn('Plugin ' + pluginAsyncId + ' unloaded!');
                pluginAsyncId = '';
                $scope.digest(function () {
                    $scope.pluginAsyncLoaded = false;
                });
            });
        };

        $scope.test = function () {
            function withEpsilon (lhs, rhs) {
                if (_.isNumber(lhs) && _.isNumber(rhs))
                    return mathUtils.nearlyEqual(lhs, rhs, mathUtils.epsilon32);
            }

            function testArgs() {
                let args = Array.prototype.slice.call(arguments, 0);
                let result = window.editorNativeTest.test.apply(window.editorNativeTest, args);

                if (args.length === 0) {
                    if (!_.isNil(result)) {
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
                    if (!_.isEqualWith(result[i], args[i], withEpsilon)) {
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
                console.error('Tests failed.');
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
                console.error('Handle test failed!');
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

        $scope.testAsync = function () {
            function testArgs(firstArg) {
                let args = Array.prototype.slice.call(arguments, 0);
                let completeArgs = ['test_query'].concat(Array.prototype.slice.call(arguments, 0));
                return stingray.hostExecute.apply(stingray, completeArgs).then(function (parsedResult) {
                    parsedResult = parsedResult[0];
                    if (args.length === 0) {
                        if (!_.isEqual(parsedResult, {type: 'test_query'})) {
                            console.error('Expected {type: "test_query"} but got ' + JSON.stringify(parsedResult) + ' instead.');
                            return false;
                        }
                        return true;
                    }

                    if (args.length === 1 && _.isObject(firstArg) && !_.isArray(firstArg)) {
                        delete parsedResult.type;
                        if (!_.isEqual(parsedResult, firstArg)) {
                            console.error('Expected ' + JSON.stringify(firstArg) + ' but got ' + JSON.stringify(parsedResult));
                            return false;
                        }
                        return true;
                    } else if (args.length === 1) {
                        if (!_.isEqual(parsedResult.value, firstArg)) {
                            console.error('Expected ' + JSON.stringify(firstArg) + ' but got ' + JSON.stringify(parsedResult));
                            return false;
                        }
                        return true;
                    } else {
                        let success = true;
                        for (let i = 0; i < args.length; ++i) {
                            if (!_.isEqual(parsedResult.args[i], args[i])) {
                                console.error('Argument ' + i + ': expected ' + JSON.stringify(args[i]) + ' but received ' + JSON.stringify(parsedResult.args[i]));
                                success = false;
                            }
                        }
                        return success;
                    }
                });
            }

            Promise.all([
                testArgs(),
                testArgs(null),
                testArgs(undefined),
                testArgs(false),
                testArgs(true),
                testArgs(3.14159),
                testArgs('bob'),
                testArgs([0, 2, 'bob']),
                testArgs({name: 'bob', value: 42}),
                testArgs([[1, 2], 3, {name: 4}]),
                testArgs(null, false, true, 3.14159, 'bob', [1, 2, 3], {name: 'bob', value: 42})
            ]).then(function (passed) {
                let failed = passed.some(function (pass) {
                    return !pass;
                });
                if (failed) {
                    console.error('Async Tests Failed!');
                } else {
                    console.warn('Async Tests passed!');
                }
            });
        };
    });
});
