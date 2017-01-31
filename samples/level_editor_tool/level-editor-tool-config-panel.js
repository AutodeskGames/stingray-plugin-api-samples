define([
    'stingray',
    'mithril',
    'properties/property-editor-component',
    'properties/property-editor-utils',
    'level-editor-tool/level-editor-tool-actions'
], function (stingray, m, PropertyEditor, props, toolApi) {
    'use strict';

    // Basic Property editor ui to edit SmartTool settings.

    var toolSettings = {
        measurements: true,
        autpParenting: true,
        snapRootToSurface: true,
        snapToFixedGrid: true
    };

    function propertyModel(path) {
        return function (property, newValue) {
            if (arguments.length > 1) {
                _.set(toolSettings, path, newValue);

                // Sends update to engine:
                toolApi.smartToolPropertyUpdate(path, newValue);
            }
            return _.get(toolSettings, path);
        };
    }

    var editorContext = props.makeEditorContext();
    var propertyEditorArgs = props.editor(editorContext, [
        props.category("Placement settings", {}, [
            props.bool("Measurements", propertyModel('measurements')),
            props.bool("Auto-Parenting", propertyModel('autpParenting')),
            props.bool("Snap Root To Surface", propertyModel('snapRootToSurface')),
            props.bool("Snap to Fixed Grid", propertyModel('snapToFixedGrid'))
        ])
    ]);

    m.mount($('#mithril-root')[0], m.component(PropertyEditor, propertyEditorArgs));

    return {
        noAngular: true
    };

});
