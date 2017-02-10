define([
    'app',
    'lodash',
    'components/mithril-ext',
    'components/json-component',
    'components/component-harness',
    'attributes/core-src',
    'services/asset-service',
    'services/object-editing-service',
    'services/marshalling-service'
], function (app, _, m, JsonComponent) {
    'use strict';

    document.title = "Mithril List";

    var marshallingService = require('services/marshalling-service');
    var objectEditingService = require('services/object-editing-service');

    app.controller('genericAssetListener', function ($scope, assetService) {
        document.title = "Generic Asset Listener";

        $scope.JsonComponent = JsonComponent;

        var assetsCache = {};

        $scope.assetListenedToName = "none";

        function showDataObject(dataObject) {
            marshallingService.invokeMethod(dataObject, "ToJson", [], {transient: true}).then(function (jsonData) {
                $scope.content = JSON.stringify(jsonData, null, 4);

                $scope.jsonArgs = {
                    jsonModel: m.helper.jsonModel(jsonData),
                    defaultCollapsed: false
                };
            });
        }

        // This shows how to listen to changes on ANY data objects being edited using the Generic asset system.
        objectEditingService.on("DataObjectsConsensusChanged", function (args) {
            var changeDesc = args[0];
            console.log(JSON.stringify(changeDesc, null, 3));

            $scope.assetListenedToName = changeDesc.AssetsModified[0];
            if (!assetsCache[$scope.assetListenedToName]) {
                assetService.getManagedAsset($scope.assetListenedToName).then(function (dataObject){
                    assetsCache[$scope.assetListenedToName] = dataObject;
                    showDataObject(dataObject);
                });
            } else {
                showDataObject(assetsCache[$scope.assetListenedToName]);
            }
        });
    });
});
