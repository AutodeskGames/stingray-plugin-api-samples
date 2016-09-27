define(['3rdparty/mithril/mithril.min'], function (m) {
    'use strict';

    // Mithril playground
    var Playground = {
        value: m.prop("edit me and press enter...")
    };

    // Mithril controller
    Playground.controller = function() {};

    // Mithril view
    Playground.view = function() {
        return [
            m("div.input-container.hide-clear", [
                m("input[type=search]", {onchange: m.withAttr("value", Playground.value), value: Playground.value()}),
            ]),
            m("span", m.trust("&nbsp;&gt;&nbsp;")),
            m("span.code", Playground.value()),
        ];
    };

    // Initialize the application
    m.mount($('#mithril-root')[0], {controller: Playground.controller, view: Playground.view});

    return {
        noAngular: true
    };
});
