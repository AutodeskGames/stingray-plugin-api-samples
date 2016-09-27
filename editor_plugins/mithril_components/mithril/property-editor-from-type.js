/** global window, console, define, alert, $*/
define([
    'app',
    'properties/mithril-property-ext',
    'properties/property-editor-utils',
    'properties/property-document',
    'properties/property-editor-component',
    'services/data-type-service',
    'components/component-harness',
    'services/marshalling-service',
    'services/host-service',
    'services/project-service',
    'services/element-service',
    'services/asset-service',
    'attributes/core-src',
    'controls/goto-link-handler'
], function (app, m, props, PropertyDocument, PropertyEditor, dataTypeService) {
    'use strict';
    document.title = "Property editor in Js";

    var hostService = require('services/host-service');

    app.controller('propertyController', function ($scope, $sce, marshallingService, elementService, projectService, assetService, fileSystemService) {
        var services = {
            marshallingService: marshallingService,
            elementService: elementService,
            projectService: projectService,
            assetService: assetService,
            fileSystemService: fileSystemService
        };

        var editorContext = props.makeEditorContext(services);

        $scope.typeFile = "No type file loaded";

        $scope.load = function () {
            return hostService.openNativeDialog(hostService.DialogType.OpenFile, "", "Select type file", '*.type', true).then(function (path) {
                if (!path) {
                    return;
                }

                $scope.typeFile = path;
                $scope.reloadTypeFile($scope.typeFileData);
            });
        };

        $scope.saveAndReloadTypeFile = function () {
            if (!$scope.typeFile)
                return;

            fileSystemService.writeFile($scope.typeFile, $scope.typeFileData).then(function () {
                $scope.reloadTypeFile();
            });
        };

        $scope.reloadTypeFile = function () {
            if (!$scope.typeFile)
                return;

            var toLoadFile = $scope.typeFile;
            $scope.typeFile = "No type file loaded";
            $scope.helperArgs = null;
            $scope.jsonArgs = null;

            dataTypeService.clear();
            return dataTypeService.resolveTypeFile(toLoadFile).then(function (typeDefinition) {
                if (!typeDefinition)
                    return;

                if (typeDefinition.types) {
                    $scope.typeFile = toLoadFile;
                    $scope.typeDefinition = typeDefinition;

                    $scope.pdoc = new PropertyDocument(editorContext.services.dataTypeService);

                    _.each(typeDefinition.types, function (typeDesc, typeKey) {
                        var value = dataTypeService.createDefaultValue(typeDesc);
                        var label = typeKey;
                        if (typeDesc.editor && typeDesc.editor.label) {
                            label = typeDesc.editor.label;
                        }

                        $scope.pdoc.addCategory(label, {}, value, typeDesc);

                    });

                    $scope.pdoc.on('propertyChanged', function (path, value, property, category, doc) {
                        console.log('onPropertyChanged', path, value, property, category, doc);
                        $scope.jsonData = JSON.stringify($scope.pdoc.dataModel, null, 4);
                        $scope.$apply();
                    });

                    $scope.pdoc.on('categoryEnabled', function (path, value, category, doc) {
                        console.log('onCategoryEnabled', path, value, category, doc);
                    });

                    $scope.helperArgs = props.editor(editorContext, $scope.pdoc.getCategories());
                    $scope.jsonData = JSON.stringify($scope.pdoc.dataModel, null, 4);

                    fileSystemService.readFile($scope.typeFile).then(function (typeFileData) {
                        $scope.typeFileData = typeFileData;
                    });
                }
            });
        };

        $scope.saveJsonOutput = function () {
            return hostService.openNativeDialog(hostService.DialogType.SaveFile, "", "Select value file to save", "", true).then(function (path) {
                if (!path || !$scope.pdoc) {
                    return;
                }

                fileSystemService.writeJSON(path, $scope.pdoc.dataModel);
                console.log(path);
            });
        };

        $scope.PropertyEditor = PropertyEditor;
    });
});
