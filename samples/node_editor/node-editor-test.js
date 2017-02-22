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

    class NodeGraphTest extends NodeEditorGraph {
        get NodeAutoCompleteData() {
            return [
                { id: '1', label: 'Test de value longue 1', tooltip: 'Test de value longue 1' },
                { id: '2', label: 'Test de value longue 2', tooltip: 'Test de value longue 2' },
                { id: '3', label: 'Test de value longue 3', tooltip: 'Test de value longue 3' },
                { id: '4', label: 'Test de value longue 4', tooltip: 'Test de value longue 4' },
                { id: '5', label: 'Test de value longue 5', tooltip: 'Test de value longue 5' },
                { id: '6', label: 'Test de value longue 6', tooltip: 'Test de value longue 6' },
                { id: '7', label: 'Test de value longue 7', tooltip: 'Test de value longue 7' },
                { id: '8', label: 'Test de value longue differente 4', tooltip: 'Test de value longue differente 4' },
                { id: '9', label: 'Test de value longue differente 5', tooltip: 'Test de value longue differente 5' },
                { id: '10', label: 'Test de value longue differente 6', tooltip: 'Test de value longue differente 6' },
                { id: '11', label: 'Test de value longue differente 7', tooltip: 'Test de value longue differente 7' }
            ];
        }
    }

    let graph = new NodeGraphTest(stingray.guid());
    let viewportConfig = NodeEditorComponent.config({viewSettings: viewSettings});

    m.render($container[0], NodeEditorComponent.component(viewportConfig));
    viewportConfig.setGraph(graph, true);
});
