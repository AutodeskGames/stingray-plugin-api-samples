define([
    'app',
    'stingray',
    'lodash',
    'components/mithril-ext',
    'node-editor/node-editor-component',
    'node-editor/node-editor-graph'
], function () {
    'use strict';

    const stingray = require('stingray');
    const m = require('components/mithril-ext');
    const NodeEditorComponent = require('node-editor/node-editor-component');
    const NodeEditorGraph = require('node-editor/node-editor-graph');

    const $container = $("#node-editor-here");
    const viewSettings = {
        viewStyle: {
            printDebugInfo: true
        }
    };

    let graph = new NodeEditorGraph(stingray.guid());
    let viewportConfig = NodeEditorComponent.config({viewSettings: viewSettings});

    m.render($container[0], NodeEditorComponent.component(viewportConfig));
    viewportConfig.setGraph(graph, true);
});
