/*global window, console, define, alert, $*/
define([
    'app',
    'lodash',
    'docking/docking-utils',
    'docking/docking-service',
    'services/settings-service',
    'controls/accordion-panel'
], function (app, _, dockingUtils) {
    'use strict';

    document.title = "Docking examples";
    app.controller('dockingExamplesController', function ($scope, dockingService) {

        function showMessage(msg, delay) {
            $scope.message = msg;
            console.info(msg);

            $("#div-message").slideToggle();

            setTimeout(function () {
                $("#div-message").slideToggle();
            }, delay || 5000);
        }


        $scope.message = "";

        $scope.tab = {
            modelNewTab: "New tab name",
            modelFocusAfter: true,
            modelRename: "Tab renamed",
            modelTooltip: "",

            add: function () {
                if ($scope.tab.modelNewTab) {
                    var dockingCtrl = document.getDocking();
                    var currentTab = document.getParentTab();
                    var newTab = _.cloneDeep(dockingService.templates.tab);

                    newTab.displayName = $scope.tab.modelNewTab;

                    dockingCtrl.addTabs(newTab, currentTab.parentRegion, $scope.tab.modelFocusAfter);
                }
            },

            rename: function () {
                if ($scope.tab.modelRename) {
                    document.getDocking().renameTab(document.getParentTab(), $scope.tab.modelRename);
                    showMessage('Tab renamed to "' + $scope.tab.modelRename + '"');
                }
            },

            setTooltip: function () {
                document.getDocking().setTabTooltip(document.getParentTab(), $scope.tab.modelTooltip);
                showMessage('Tooltip set to "' + $scope.tab.modelTooltip + '"');
            },

            getSize: function () {
                console.log(dockingUtils.getSize(document.getParentTab().iframe, true, true));
                showMessage('Tab size and position printed to console.');
            }
        }

    });
});
