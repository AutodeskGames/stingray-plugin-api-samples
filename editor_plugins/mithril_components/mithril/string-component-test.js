/*global window, console, define, alert, $*/
define([
    'app',
    'components/mithril-ext',
    'components/textbox',
    'components/component-harness'
], function (app, m, TextboxComponent) {
    'use strict';
    document.title = "Mithril String";
    app.controller('mithrilStringController', function ($scope) {
        window.timedDigest = true;

        /*
         {OPTS} :
         [title]: String
         [disabled]: Boolean
         [readOnly]: Boolean
         [placeholder]: String
         [multiLines]: Boolean
         [lineRows]: Integer
         [selectOnClick]: Boolean
         [clearable]: Boolean
         [clearableClass]: String
         [clearableTrigger]: Function
         */

        ////////////////////////////////////////////////
        // Number input textfield

        var angularUpdateModel = function (key) {
            return m.helper.modelFromGetterSetter(
                function getter() {
                    return $scope[key];
                },
                function setter(newValue) {
                    $scope.$apply(function () {
                        $scope[key] = newValue;
                    });
                }
            )
        };

        $scope.textValue = "pow!";
        $scope.textModel = angularUpdateModel('textValue');

        $scope.onChangeStringArgs = {
            model: $scope.textModel,
            selectOnClick: false
        };

        $scope.liveStringArgs = {
            model: $scope.textModel,
            liveUpdate: true,
            focusMe: true,
            selectOnClick: true,
            clearable: true,
            onClear: function () {
                console.warn('content has been cleared!');
            }
        };

        $scope.readOnlyStringArgs = {
            model: $scope.textModel,
            readOnly: true
        };

        var index = 0;
        var models = ['ping', 'pong', 'bong', 'bing', 'pow', 'paw'];
        $scope.randomizeModel = function () {
            index++;
            if (index >= models.length) {
                index = 0;
            }
            $scope.textValue = models[index];

            m.redraw();
        };


        ////////////////////////////////////////////////
        // Number input textfield

        $scope.number1 = 45.0;
        $scope.numberModel1 = m.helper.numberModel(angularUpdateModel('number1'));

        $scope.number1Args = {
            numberModel: $scope.numberModel1
        };

        $scope.number2 = 98.877787;
        $scope.numberModel2 = m.helper.numberModel(angularUpdateModel('number2'), -19.0, 198, 3, 0.75);

        $scope.number2Args = {
            numberModel: $scope.numberModel2
        };

        $scope.StringComponent = TextboxComponent;
    });
});
