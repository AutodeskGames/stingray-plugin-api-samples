/*global window, console, define, alert, $*/
define([
    'app',
    'lodash',
    'components/mithril-ext',
    'components/json-component',
    'components/dom-tools',
    'components/component-harness',
    'attributes/core-src'
], function (app, _, m, JsonComponent, domTools) {
    'use strict';
    document.title = "Mithril List";
    app.controller('mithrilListController', function ($scope) {
        window.timedDigest = true;

        document.title = "Json Component";

        // domTools.loadCss('core/css/widgets/json-component.css');

        var dataTemplate = {
            capacity: 10,
            casts_shadows: false,
            float_channels: [
                "age",
                "life",
                "size",
                [
                    1,
                    2,
                    3
                ]
            ],
            object: {
                prop1: "props to you",
                number: 69.69696
            }
        };

        function genBigData (nbTimes) {
            var bigData = {};
            for (var i = 0; i < nbTimes; ++i) {
                _.each(dataTemplate, function (value, key) {
                    var newKey = key + '_' + i;
                    bigData[newKey] = _.clone(value, true);
                });
            }
            return bigData;
        }

        // var data = dataTemplate;
        var nbTemplate = 100;
        var data = genBigData(nbTemplate);

        function countProperty(obj) {
            var count = 0;
            if (_.isArray(obj) || _.isPlainObject(obj)) {
                _.each(obj, function (value) {
                    count += countProperty(value);
                });
            } else {
                count = 1;
            }

            return count;
        }

        var templatePropCount = countProperty(dataTemplate);
        $scope.propTotal = nbTemplate * templatePropCount;

        $scope.argsNormal = {
            jsonObj: _.extend({jsonCompType: 'normal'}, data),
            defaultCollapsed: false
        };

        $scope.argsExploded = {
            jsonObj: _.extend({jsonCompType: 'exploded'}, data),
            defaultCollapsed: false
        };

        $scope.JsonComponent = JsonComponent;

        $scope.normal = true;
    });
});
