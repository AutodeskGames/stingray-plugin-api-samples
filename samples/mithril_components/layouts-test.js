define(function (require) {
    'use strict';

    document.title = 'Mithril Layouts';

    const m = require('components/mithril-ext');
    const Choice = require('components/choice');
    const Button = require('components/button');
    require('components/resizer');

    class LayoutsController {
        constructor() {
            this.selectedLayout = m.prop('');
            this.selectedLayout('simple.single');
        }

        toolbar() {
            let layoutSelect = Choice.component({
                model: this.selectedLayout,
                getOptions: LayoutsController.getLayoutOptions
            });

            return m('div.toolbar',
                m('div.left-section'),
                m('div.right-section', [
                    m('label', 'Select layout : '),
                    layoutSelect
                ])
            );
        }

        static getLayoutOptions() {
            return {
                'Simple Single': 'simple.single',
                'Simple with Toolbar': 'simple.toolbar',
                'Simple Horizontal': 'simple.horizontal',
                'Simple Vertical': 'simple.vertical',
                'Simple Mix': 'simple.mix',
                'Resizer Horizontal': 'resizer.horizontal',
                'Resizer Vertical': 'resizer.vertical',
                'Resizer Mix': 'resizer.mix',
                'Property Table': 'property.table'
            };
        }

        getLayout(layout) {
            switch (layout) {
                case 'simple.single':
                    return m.layout.container({ className: 'stingray-panel stingray-border-dark' }, [
                        'Panel 1'
                    ]);

                case 'simple.toolbar':
                    return m.layout.vertical({ className: 'stingray-panel stingray-border-dark' }, [
                        m('div.toolbar', [
                            Button.component({
                                title: 'Refresh',
                                faIcon: 'fa-refresh',
                                type: m.button.icon
                            }),
                            Button.component({
                                title: 'Refresh',
                                faIcon: 'fa-cloud-download',
                                type: m.button.icon
                            })
                        ]),
                        m.layout.container({ className: 'stingray-panel-dark panel-fill' }, [
                            'Panel 1'
                        ])
                    ]);

                case 'simple.horizontal':
                    return m.layout.horizontal({}, [
                        m.layout.panelFill({ className: 'stingray-panel stingray-border-dark' }, m.layout.container({}, [
                            'Panel H1'
                        ])),
                        m.layout.panelFill({ className: 'stingray-panel-mid stingray-border-dark' }, m.layout.container({}, [
                            'Panel H2'
                        ])),
                        m.layout.panelFill({ className: 'stingray-panel-dark stingray-border-dark' }, m.layout.container({}, [
                            'Panel H3'
                        ]))
                    ]);

                case 'simple.vertical':
                    return m.layout.vertical({}, [
                        m.layout.panelFill({}, m.layout.container({ className: 'stingray-panel stingray-border-dark' }, [
                            'Panel V1'
                        ])),
                        m.layout.panelFill({}, m.layout.container({ className: 'stingray-panel-mid stingray-border-dark' }, [
                            'Panel V2'
                        ])),
                        m.layout.panelFill({}, m.layout.container({ className: 'stingray-panel-dark stingray-border-dark' }, [
                            'Panel V3'
                        ]))
                    ]);

                case 'simple.mix':
                    return m.layout.horizontal({}, [
                        m.layout.panelFill({}, m.layout.container({ className: 'stingray-panel stingray-border-dark' }, [
                            'Panel H1'
                        ])),
                        m.layout.panelFill({}, m.layout.container({ className: 'stingray-panel-mid stingray-border-dark' }, [
                            'Panel H2'
                        ])),
                        m.layout.panelFill({}, m.layout.container({ className: 'stingray-panel-dark' }, [
                            this.getLayout('simple.vertical')
                        ]))
                    ]);

                case 'resizer.horizontal':
                    return m.resizer.container({ direction: 'horizontal', redrawOnResize: false }, { className: 'fullscreen' }, [
                        m.resizer.panel({ 'min-size': 50, ratio: 1 }, [
                            m.layout.container({ className: 'stingray-panel stingray-border-dark' }, [
                                'Panel H1'
                            ])
                        ]),
                        m.resizer.panel({ 'min-size': 50, ratio: 1 }, [
                            m.layout.container({ className: 'stingray-panel-mid stingray-border-dark' }, [
                                'Panel H2'
                            ])
                        ]),
                        m.resizer.panel({ 'min-size': 50, ratio: 1 }, [
                            m.layout.container({ className: 'stingray-panel-dark stingray-border-dark' }, [
                                'Panel H3'
                            ])
                        ])
                    ]);

                case 'resizer.vertical':
                    return m.resizer.container({ direction: 'vertical', redrawOnResize: false }, { className: 'fullscreen' }, [
                        m.resizer.panel({ 'min-size': 50, ratio: 1 }, [
                            m.layout.container({ className: 'stingray-panel stingray-border-dark' }, [
                                'Panel V1'
                            ])
                        ]),
                        m.resizer.panel({ 'min-size': 50, ratio: 1 }, [
                            m.layout.container({ className: 'stingray-panel-mid stingray-border-dark' }, [
                                'Panel V2'
                            ])
                        ]),
                        m.resizer.panel({ 'min-size': 50, ratio: 1 }, [
                            m.layout.container({ className: 'stingray-panel-dark stingray-border-dark' }, [
                                'Panel V3'
                            ])
                        ])
                    ]);

                case 'resizer.mix':
                    return m.resizer.container({ direction: 'horizontal', redrawOnResize: false }, { className: 'fullscreen' }, [
                        m.resizer.panel({ 'min-size': 50, ratio: 1 }, [
                            m.layout.container({ className: 'stingray-panel stingray-border-dark' }, [
                                'Panel H1'
                            ])
                        ]),
                        m.resizer.panel({ 'min-size': 50, ratio: 1 }, [
                            this.getLayout('resizer.vertical')
                        ]),
                        m.resizer.panel({ 'min-size': 50, ratio: 1 }, [
                            m.layout.container({ className: 'stingray-panel-dark stingray-border-dark' }, [
                                'Panel H3'
                            ])
                        ])
                    ]);

                case 'property.table':
                    return m.resizer.container({ direction: 'horizontal', redrawOnResize: false }, { className: 'fullscreen' }, [
                        m('table.property-table', {
                            onmouseover: (event) => {
                                let resizer;
                                let pt = $('table.property-table');
                                let resizing = false;
                                let mouseDownOffsetX = 0;

                                function resizerMouseOut() {
                                    if (resizer && !resizing)
                                        resizer.hide();
                                }

                                function documentMouseMove(event) {
                                    let x = Math.min(pt.width() - 50, Math.max(40, event.clientX - mouseDownOffsetX));
                                    resizer.css({ left: x });
                                    $('col.column1').css({ width: `${(x * 100) / (pt.width())}%` });
                                }

                                function documentMouseUp(event) {
                                    resizing = false;
                                    mouseDownOffsetX = 0;
                                    document.removeEventListener('mousemove', documentMouseMove, true);
                                    document.removeEventListener('mouseup', documentMouseUp, true);

                                    if (event.srcElement !== resizer.get(0) && !event.srcElement.classList.contains('pt-td-resizer'))
                                        resizer.hide();
                                }

                                function _positionResizer() {
                                    let left = $('td.pt-td-resizer').first().position().left;
                                    let top = pt.offset().top;
                                    let height = pt.height() + 2;
                                    resizer.css({ top: top, left: left, height: height });
                                }
                                if (event.target && event.target.cellIndex === 1) {
                                    resizer = $('.pt-resizer-guide');
                                    if (resizer.length === 0) {
                                        resizer = $('<div class="pt-resizer-guide" ><div class="pt-resizer-guide-content" /></div>');
                                        resizer.get(0).addEventListener('mouseout', resizerMouseOut, true);
                                        resizer.get(0).addEventListener('mousedown', (event) => {
                                            resizing = true;
                                            mouseDownOffsetX = event.pageX - resizer.offset().left;
                                            document.addEventListener('mousemove', documentMouseMove, true);
                                            document.addEventListener('mouseup', documentMouseUp, true);
                                        });

                                        $('body').append(resizer);
                                    } else {
                                        resizer.show();
                                    }

                                    _positionResizer();
                                }
                            }
                        }, [
                                m('col.column1'),
                                m('col.pt-col-resizer'),
                                m('col.column3'),
                                m('tr.pt-category', [
                                    m('td', { colspan: 3 }, 'Global Lighting')
                                ]),
                                m('tbody', [
                                    m('tr', [
                                        m('td.l', 'Skydome Map'),
                                        m('td.pt-td-resizer'),
                                        m('td.c', m('input', { type: 'text', style: 'width:100%;' }))
                                    ]),
                                    m('tr', [
                                        m('td.l', 'Skydome Intensity'),
                                        m('td.pt-td-resizer'),
                                        m('td.c', m('input', { type: 'text', style: 'width:100%;' }))
                                    ]),
                                    m('tr', [
                                        m('td.l', 'Global Diffuse Map'),
                                        m('td.pt-td-resizer'),
                                        m('td.c', m('input', { type: 'text', style: 'width:100%;' }))
                                    ]),
                                ]),

                                m('tr.pt-category', [
                                    m('td', { colspan: 3 }, 'Screen-Space Ambient Occlusion')
                                ]),
                                m('tbody', [
                                    m('tr', [
                                        m('td.l', 'World Space Radius'),
                                        m('td.pt-td-resizer'),
                                        m('td.c', m('input', { type: 'text', style: 'width:100%;' }))
                                    ]),
                                    m('tr.red', [
                                        m('td.l', 'Fall Off'),
                                        m('td.pt-td-resizer'),
                                        m('td.c', m('input', { type: 'text', style: 'width:100%;' }))
                                    ]),
                                    m('tr', [
                                        m('td.l', 'Surface Offset'),
                                        m('td.pt-td-resizer'),
                                        m('td.c', m('input', { type: 'text', style: 'width:100%;' }))
                                    ]),
                                ]),
                            ]),
                    ]);
            }
        }

    }

    class LayoutsApp {
        static controller(opts) {
            return new LayoutsController(opts);
        }

        static view(ctrl) {
            return m.layout.vertical({ className: 'module-layouts-test stingray-panel' }, [
                ctrl.toolbar(),
                m.layout.container({ className: 'module-example stingray-panel-mid panel-fill' }, ctrl.getLayout(ctrl.selectedLayout()))
            ]);
        }
    }


    // Initialize the application
    m.mount($('#mithril-root')[0], m.component(LayoutsApp, {}));

    return {
        noAngular: true
    };
});
