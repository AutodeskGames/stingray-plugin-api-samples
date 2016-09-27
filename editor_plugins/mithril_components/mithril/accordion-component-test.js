define([
    'app',
    'components/mithril-ext',
    'components/accordion',
    'components/button',
    'components/component-harness'
], function (app, m, Accordion, Button) {
    'use strict';
    document.title = "Mithril Accordion";
    app.controller('mithrilStringController', function ($scope) {
        window.timedDigest = true;

        $scope.dummyArgs = {
        };

        $scope.Something = {
            view: function () {
                return m('div', {className: 'full-width accordion'}, [
                    Accordion.component([
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
                    ]),
                    Accordion.component(
                        {
                            title:'Single object',
                            content: function(){
                                    return Button.component({text:'Click me!', onclick:function(){
                                        console.log('clicked!');
                                    }});
                            }
                        })
                ]);
            }
        };
    });
});
