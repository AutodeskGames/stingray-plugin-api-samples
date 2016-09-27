/*global window, console, define, alert, $*/
define([
    'app',
    'components/mithril-ext',
    'components/slider',
    'components/component-harness',
    'services/marshalling-service'
], function (app, m, SliderComponent) {
    'use strict';
    document.title = "Mithril Choice";

    app.controller('mithrilChoiceController', function ($scope) {
        window.timedDigest = true;

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
            );
        };

        $scope.defaultValue = 5;
        $scope.differentValue = 90;
        $scope.sliderArgs = {
            id: 'choice1',
            min: -100,
            max: 100,
            placeholder: 'Enter value',
            step: 1,
            showLabel: true,
            model: m.helper.numberModel(angularUpdateModel('defaultValue')),
            label: 'Default'
        };

        $scope.readonlyArgs = {
            id: 'choice3',
            min: -100,
            max: 100,
            placeholder: 'Enter value',
            step: 1,
            model: m.helper.numberModel(angularUpdateModel('differentValue')),
            disabled: true,
            showLabel: true,
            label: 'Read only'
        };

        $scope.bigStepValue = 10;
        $scope.bigStepArgs = {
            id: 'choice4',
            min: -100,
            max: 100,
            placeholder: 'Enter value',
            step: 10,
            model: m.helper.numberModel(angularUpdateModel('bigStepValue')),
            showLabel: true,
            label: 'Big step'
        };

        $scope.SliderComponent = SliderComponent;
    });
});
