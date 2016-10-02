/*global console, define*/
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

    var useOptions1 = true;
    var enumStringOptions1 = {
        "Surface Normal": "SurfaceNormal",
        "World Up!!": "WorldUp"
    };

    var enumStringOptions2 = {
        "This is an options": "options",
        "this is something else": "else",
        "try something new": "of doom"
    };

    exports.switchEnumString = function (/*property, actionInfo*/) {
        useOptions1 = !useOptions1;
        m.redraw();
    };

    exports.populateActions = function (/*property, actionInfo*/) {
        return Promise.resolve(useOptions1 ? enumStringOptions1 : enumStringOptions2);
    };

    return exports;
});
