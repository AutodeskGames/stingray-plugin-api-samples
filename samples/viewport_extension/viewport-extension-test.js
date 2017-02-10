define([
    'app',
    'stingray',
    'lodash',
    'mithril',
    'components/engine-viewport'
], function () {
    'use strict';

    const m = require('mithril');
    const EngineViewport = require('components/engine-viewport');

    const $container = $("#viewport-here");

    let viewportConfig = EngineViewport.config({name: "viewport-extension-test"});

    m.render($container[0], EngineViewport.component(viewportConfig));

});
