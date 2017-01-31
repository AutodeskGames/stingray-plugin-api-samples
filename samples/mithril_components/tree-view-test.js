define([
    'components/mithril-ext',
    'components/tree-view',
    'common/tree-view-utils'
], function (m, TreeViewComponent, treeViewUtils) {
    'use strict';
    document.title = "Mithril Tree View";

    class TreeModel extends treeViewUtils.TreeModel {
        constructor () {
            super("my_tree_root");
        }
        onSelectNode (node) {
            console.warn("node selected: ", node);
        }
        getNodeActions (node) {
            var menu = [];
            menu.push(["Do something", {}, function () {
                console.warn('do something with ', node);
            }]);

            menu.push(["Do foo", {}, function () {
                console.warn('do foo with ', node);
            }]);

            menu.push(null);

            menu.push(["Do else", {}, function () {
                console.warn('do else with ', node);
            }]);

            return menu;
        }
    }

    var treeModel = new TreeModel();

    // Populate dummy values in our tree:
    var root = treeModel.addNode(treeModel._root, "Top of tree", "<my node type>", {
        customData: "this is my root user defined data"
    });

    var firstBranch = treeModel.addNode(root, "A branch", "<branch type>", {
        customData: "this is my branch user defined data"
    });

    _.each(["ping", "pong", "bing"], function (value) {
        treeModel.addNode(firstBranch, value, "<sub branch type>");
    });

    // Deep hierarchy:
    var parent = root;
    _.each(["this", "is", "a", "branch", "hierarchy"], function (value) {
        parent = treeModel.addNode(parent, value, "<whatever node type>");
    });

    var treeViewConfig = {
        treeViewModel: treeModel,
        hideSearchBox: true,
        hideRoot: true,
        disableSelectedNodes: true,
        disableAutoExpandSelected: true,
        disableRightClickSelect: true,
        performanceRedraw: true,
        containerIdentifier: '.tree-view-container'
    };


    var MithrilApp = {
        view: function () {
            return m('div', {className: "fullscreen tree-view-container"},
                TreeViewComponent.component(treeViewConfig)
            );
        }
    };

    // Initialize the application
    m.mount($('#mithril-root')[0], m.component(MithrilApp, {}));

    return {
        noAngular: true
    };
});
