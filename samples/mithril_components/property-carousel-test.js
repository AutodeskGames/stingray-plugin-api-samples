/*global window, console, define, alert, $*/
define([
    'properties/mithril-property-ext',
    'properties/property-editor-utils',
    'properties/property-editor-component',
    'common/project-utils',
    'common/file-system-utils',
    'attributes/core-src'
], function (m, props, PropertyEditor, projectUtils, fileSystemUtils) {
    'use strict';
    document.title = "Mithril List";

    const hostService = require('services/host-service');
    const projectService = require('services/project-service');

    function createElement (rowIndex, name, path) {
        if (path && name) {
            return {
                name: props.string('Name', m.property.modelIgnoringPropDesc(m.prop(name)), {
                    showValue: false,
                    showLabel: false
                }),
                path: props.resource('Unit', m.property.modelIgnoringPropDesc(m.prop(path)), 'unit'),
                intensity: props.number('Intensity', m.property.modelIgnoringPropDesc(m.prop(1)))
            };
        }

        return projectUtils.selectResource(projectService, hostService, 'unit').then(function (resourceName) {
            name = fileSystemUtils.getFileName(resourceName, true);
            path = resourceName;
            return createElement(rowIndex, name, path);

        }).catch(m.utils.noop);

    }

    var elements = [
        createElement(0, "pow", "core/units/light"),
        createElement(1, "ping", "core/units/camera")
    ];

    var config = {
        thumbnailSourceProperty: function (element) {
            return element.path.model() + '.unit';
        },
        displayNameProperty: "name"
    };

    var collectionModel = m.property.arrayCollectionModel(elements, createElement);

    var editorContext = props.makeEditorContext();

    var carousel1 = props.editor(editorContext, [
        props.category("Carousel1", {}, [
            props.carousel("Carousel1", config, collectionModel)
        ])
    ]);

    var carousel2 = props.editor(editorContext, [
        props.category("Carousel2", {}, [
            props.carousel("Carousel2", config, collectionModel)
        ])
    ]);

    function carouselDiv( model) {
        return m('div', {}, [
            PropertyEditor.view(PropertyEditor.controller(model))
        ]);
    }

    var MithrilApp = {
        view: function () {
            return m('div', {class: "carousel-component-test stingray-panel fullscreen"},
                m("div", {class: "main-container"}, [
                    m('div', {class: "panel-fill panel-flex-horizontal fullscreen", style: "overflow: auto;"}, [
                        m('div', {class: 'panel-fill'}, [
                            'A Property Editor',
                            carouselDiv( carousel1)
                        ]),
                        m('div', {class: 'panel-fill'}, [
                            'Another property editor',
                            carouselDiv( carousel2)
                        ])
                    ])
                ])
            );
        }
    };

    // Initialize the application
    m.mount($('#mithril-root')[0], m.component(MithrilApp, {}));

    return {
        noAngular: true
    };
});
