define([
    'components/mithril-ext',
    'components/resizer'
], function (m) {
    'use strict';
    document.title = "Mithril Layout and Resizer";

    var MithrilApp = {
        view: function () {
            return m.layout.container({}, [
                m('div', {className: "toolbar", style: 'background-color: red;'}, "toolbar"),
                m.resizer.container({direction:'horizontal', redrawOnResize: true}, {style:'width:100%; height:100%;'}, [
                    m.resizer.panel({'min-size': 50, ratio: 1}, [
                        m.resizer.container({direction:'vertical', redrawOnResize: true}, {style:'width:100%; height:100%;'}, [
                            m.resizer.panel({'min-size': 50, ratio: 1, style: 'background-color: green;'}, "p1"),
                            m.resizer.panel({'min-size': 100, ratio: 1, className: '', style: 'background-color: blue;' }, "p2")
                        ])
                    ]),
                    m.resizer.panel({'min-size': 100, ratio: 1, className: '', style: 'background-color: yellow;' }, 'p3')
                ])
            ]);
        }
    };

    // Initialize the application
    m.mount($('#mithril-root')[0], m.component(MithrilApp, {}));

    return {
        noAngular: true
    };
});
