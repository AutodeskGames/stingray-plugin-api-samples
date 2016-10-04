define([
    'properties/mithril-property-ext',
    'properties/property-editor-utils',
    'properties/property-editor-component',
    'components/color-gradient',
    'services/marshalling-service',
    'services/host-service',
    'services/project-service',
    'services/element-service',
    'services/asset-service',
    'services/file-system-service',
    'components/dom-tools'
], function ( m, props, PropertyEditor, GradientComponent, marshallingService,hostService, projectService, elementService,assetService,fileSystemService,domTools) {
    'use strict';
    document.title = "Mithril Propery Table";

    domTools.loadCss("core/css/widgets/property-editor.css");
    domTools.loadCss("core/css/widgets/json-component.css");

    var services = {
        marshallingService: marshallingService,
        elementService: elementService,
        projectService: projectService,
        assetService: assetService,
        fileSystemService: fileSystemService
    };

    var elements = [
        createElement("pow", [56, 89]),
        createElement("ping", [64, -2]),
        createElement("pong", [33, 0]),
        createElement("piou", [1, 3])
    ];

    function createElement (name, vec) {
        return {
            "Name": props.string('Name', m.property.modelIgnoringPropDesc(m.prop(name || "row "))),
            "Vector2": props.vector2('Vector2', m.property.modelIgnoringPropDesc(m.prop(vec || [99, 66])))
        };
    }

    var header = [
        {
            label: "Name",
            description: "this is the name"
        },
        {
            label: "Position",
            description: "this is my position"
        }
    ];

    var collectionModel = m.property.defaultCollectionModel(elements, createElement);

    var editorContext = props.makeEditorContext(services);
    var propArgs1 = props.editor(editorContext, [
        props.category("Table", {}, [
            props.table("Table 1", header, collectionModel)
        ])
    ]);

    var propArgs2 = props.editor(editorContext, [
        props.category("Table", {}, [
            props.table("Table 2", header, collectionModel)
        ])
    ]);

    function propertyTableDiv( model) {
        return m('div', {}, [
            PropertyEditor.view(PropertyEditor.controller(model))
        ]);
    }

    var MithrilApp = {
        view: function () {
            return m('div', {class:"table-component-test stingray-panel fullscreen",style:"display: flex; flex-direction: column; height: 100%"}, [
                m('div', {class:"panel-fill panel-flex-horizontal fullscreen", style:"overflow: auto;"}, [
                    m('div', {class: "panel-fill"}, [
                        "A Property Editor",
                        propertyTableDiv(propArgs1)
                    ]),
                    m('div', {class: "panel-fill"}, [
                        "Another Property Editor",
                        propertyTableDiv(propArgs2)
                    ])
                ])
            ]);
        }
    };

    // Initialize the application
    m.mount($('#mithril-root')[0], m.component(MithrilApp, {}));

    return {
        noAngular: true
    };
});
