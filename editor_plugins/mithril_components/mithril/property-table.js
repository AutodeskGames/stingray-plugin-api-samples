define([
    'app',
    'properties/mithril-property-ext',
    'properties/property-editor-utils',
    'properties/property-editor-component',
    'components/color-gradient',
    'components/component-harness',
    'services/marshalling-service',
    'services/host-service',
    'services/project-service',
    'services/element-service',
    'services/asset-service',
    'attributes/core-src'
], function (app, m, props, PropertyEditor) {
    'use strict';
    document.title = "Mithril List";
    app.controller('propertyController', function ($scope, marshallingService, elementService,
                                                   projectService, assetService, fileSystemService) {

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
        $scope.propArgs1 = props.editor(editorContext, [
            props.category("Table", {}, [
                props.table("Table 1", header, collectionModel)
            ])
        ]);

        $scope.propArgs2 = props.editor(editorContext, [
            props.category("Table", {}, [
                props.table("Table 2", header, collectionModel)
            ])
        ]);

        $scope.PropertyEditor = PropertyEditor;

    });
});
