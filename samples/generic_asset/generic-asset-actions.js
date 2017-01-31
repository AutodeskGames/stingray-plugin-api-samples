/*global console, define*/
define(function (require) {
    'use strict';

    const _ = require('lodash');
    const m = require('components/mithril-ext');
    const objectEditingService = require('services/object-editing-service');
    const dataTypeService = require('services/data-type-service');

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

    exports.selectGenericDataInlineType = function () {
        console.log('select generic data!');
        let typeDesc = {
            type: ':struct',
            fields: {
                Number: {
                    type: ":number",
                    default: 1,
                    min: 0,
                    max: 1,
                    editor: {
                        control: "Number",
                        step: 0.3,
                        priority: 4
                    }
                }
            }
        };
        let value = dataTypeService.createDefaultValue(typeDesc);

        return objectEditingService.performSetSelectionCommand({displayType: 'FromType', displayName: 'Pow', typeDesc: typeDesc, value: value});
    };

    exports.selectGenericDataTypeFile = function () {
        console.log('select generic data!');
        let value = {
            Number: 0.7
        };

        return objectEditingService.performSetSelectionCommand({displayType: 'FromType', displayName: 'Pow', typeFile: 'all_ui/all_ui.type', value: value});
    };

    return exports;
});
