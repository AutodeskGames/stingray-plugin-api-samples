/*global window, console, define, alert, $*/
define([
    'lodash',
    'components/mithril-ext'
], function (_, m) {
    'use strict';

    var exports = {};

    exports.triggerAction = function (property, actionInfo) {
        var jsonDocument = property.getPropertyValue();
        console.log('trigger action property: ', property.label, ' - actionInfo: ', actionInfo.module, '- jsonDocument', jsonDocument);
        var originalText = property.text;
        property.text = "Waiting...";
        property.isReadOnly = true;
        m.redraw();

        setTimeout(function () {
            property.text = originalText;
            property.isReadOnly = false;
            m.redraw();
        }, 4000);
    };

    exports.populateActions = function (property, actionInfo) {
        return Promise.resolve({
            "Surface Normal": "SurfaceNormal",
            "World Up!!": "WorldUp"
        });
    };

    return exports;
});
