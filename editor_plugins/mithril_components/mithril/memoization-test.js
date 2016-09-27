/*global window, console, define, alert, $*/
define([
    'app',
    'components/mithril-ext',
    'components/spinner',
    'common/math-utils',
    'components/component-harness',
    'services/marshalling-service',
], function (app, m, Spinner, mathUtils) {
    'use strict';
    document.title = "Mithril Spinner";
    app.controller('mithrilSpinnerController', function ($scope, marshallingService) {
        $scope.redraw = function () {
            m.redraw();
        };

        $scope.redrawAll = function () {
            m.redraw.strategy('all');
            m.redraw();
        };

        // redraw without memoization: for 500 spinners 130-190ms

        var spinnerArgs = {
            marshallingService: marshallingService,
            defaultValue: 42.5,
            min: -19,
            max: 169,
            increment: 0.75,
            showLabel: true,
            label: "X",
            decimal: 4
        };

        var spinnerConfigs = [];
        var nbSpinners = 500;
        for (var i = 0; i < nbSpinners; ++i) {
            var value = Math.random() * 100;
            var spinnerArg = {
                model: m.prop(value)
            };
            spinnerConfigs.push(spinnerArg);
        }

        $scope.randomize = function () {
            spinnerConfigs[0].model(Math.random() * 1000);
            m.redraw();
        };

        var MemoizationView = {
            view: function () {
                return m('ul', {}, spinnerConfigs.map(function (config) {
                    var args = _.merge({}, spinnerArgs, config);
                    return m('li', {style: {margin: "5px"}}, Spinner.component(args));
                }));
            }
        };

        var anchor = $('.spinner-anchor');
        m.mount(anchor[0], m.component(MemoizationView, {}));
        m.debug.installLogRedraw();
    });
});
