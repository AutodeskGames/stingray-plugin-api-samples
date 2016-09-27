define([
    'app',
    'stingray',
    'lodash',
    '3rdparty/mithril/mithril.min',
    'components/engine-viewport'
], function () {
    'use strict';

    var m = require('3rdparty/mithril/mithril.min');
    var EngineViewport = require('components/engine-viewport');

    var $container = $("#viewport-here");

    m.render($container[0], EngineViewport.component({
        name: "viewport-extension-test"
    }));

});
