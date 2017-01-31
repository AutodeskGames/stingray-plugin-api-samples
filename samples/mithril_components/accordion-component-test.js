define([
    'components/mithril-ext',
    'components/accordion',
    'components/button'
], function (m, Accordion, Button) {
    'use strict';
    document.title = "Mithril Accordion";

    var accordion1 = [
        {
            title:'Title 1',
            content: function(){
                return [
                    Button.component({text:'Click me!', onclick:function(){
                        console.log('clicked!');
                    }})
                ];
            }
        },
        {
            title:'Title 2',
            isExpanded: true,
            content: function(){
                return [
                    m('div', {style:'padding:5px', innerText:'Some other content.'})
                ];
            }
        }
    ];

    var accordion2 = {
        title:'Single object',
        content: function(){
            return Button.component({text:'Click me!', onclick:function(){
                console.log('clicked!');
            }});
        }
    };

    function accordionDiv(model) {
        return m('div', {className: 'full-width accordion'},
            Accordion.component(model)
        );
    }

    var MithrilApp = {
        view: function () {
            return m('div', {class: "accordion-component-test stingray-panel fullscreen"},
                accordionDiv(accordion1),
                accordionDiv(accordion2)
            );
        }
    };

    // Initialize the application
    m.mount($('#mithril-root')[0], m.component(MithrilApp, {}));

    return {
        noAngular: true
    };
});
