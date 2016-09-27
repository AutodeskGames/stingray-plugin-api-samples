/*global window, console, define, alert, $*/
define([
    'app',
    'components/mithril-ext',
    'components/spinner',
    'common/math-utils',
    'components/component-harness',
    'services/marshalling-service'
], function (app, m, Spinner, mathUtils) {
    'use strict';

    document.title = "Mithril Spinner";
    app.controller('mithrilSpinnerController', function ($scope, marshallingService) {
        window.timedDigest = true;

        ///////////////////////////////////////
        // Angular setup
        $scope.min = -19;
        $scope.max = 169;
        $scope.step = 0.75;
        $scope.angularValue = 24.4;
        $scope.numberProxy = function() {
            // 1. Prevent null value from getting to backend
            // 2. Round to a precision of 4 digits
            return {
                get value() {
                    return mathUtils.numberTruncate($scope.angularValue, 4);
                },
                set value(value) {
                    if (value >= $scope.min && value <= $scope.max) {
                        $scope.angularValue = value;
                        m.redraw();
                    }
                }
            };
        };

        ///////////////////////////////////////
        // Mithril FTW

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

        var model = angularUpdateModel('angularValue');

        $scope.spinnerArgs = {
            marshallingService: marshallingService,
            model: model,
            defaultValue: 42.5,
            min: -19,
            max: 169,
            increment: 0.75,
            showLabel: true,
            label: "X",
            decimal: 4
        };

        $scope.angularEnabled = true;
        $scope.mithrilEnabled = true;

        $scope.Spinner = Spinner;
    });
});
