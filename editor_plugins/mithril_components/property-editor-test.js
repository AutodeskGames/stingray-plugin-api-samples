/*global window, console, define, alert, $*/
define([
    'properties/mithril-property-ext',
    'properties/property-editor-utils',
    'properties/property-editor-component',
    'components/color-gradient',
    'components/component-harness',
    'components/dom-tools',
    'services/marshalling-service',
    'services/host-service',
    'services/project-service',
    'services/element-service',
    'services/asset-service',
    'components/checkbox',
    'components/button',
    'services/file-system-service',
], function (m, props, PropertyEditor, Gradient, Harness,  domTools, marshallingService, hostService,
                          projectService, elementService, assetService,  CheckboxComponent,ButtonComponent,
                          fileSystemService
) {
    'use strict';
    document.title = "Mithril Property Editor";

    domTools.loadCss("core/css/widgets/json-component.css");
    domTools.loadCss("core/css/widgets/property-editor.css");

    var services = {
        marshallingService: marshallingService,
        elementService: elementService,
        projectService: projectService,
        assetService: assetService,
        fileSystemService: fileSystemService
    };

    var editorContext = props.makeEditorContext(services);

    var models = {};
    var propertyModel = function (id, initialValue, forceRefresh) {
        if (!models[id]) {
            var value;
            if (!_.isUndefined(initialValue)) {
                value = initialValue;
            }

            models[id] = function (property, newValue) {
                if (arguments.length > 1) {
                    value = newValue;
                    if (forceRefresh) {
                        m.utils.redraw();
                    }
                }
                return value;
            };
        }

        return models[id];
    };

    var modelId = 0;

    var choiceOptions = {
        "Value 1": 'value1',
        "Value 2": 'value2',
        "Value 3": 'value3',
        "Value 4": 'value4'
    };

    var jsonValue = {
        "string" : "this is some text",
        "number" : 45,
        array : [
            1,
            2,
            {
                bool: "true",
                ping: "pong"
            }
        ],
        dict: {
            key: "value",
            'this answer' : 42
        }
    };

    function createNewGradientElement (pos, color) {
        modelId++;
        return Gradient.createGradientElement(
            propertyModel('stop.color' + modelId, color || [0.5, 0.5, 0.5]),
            propertyModel('stop.x' + modelId, pos)
        );
    }

    function createNewRow (rowIndex, name, x, y) {
        modelId++;
        return [
            {
                displayType: "String",
                label: "Name",
                showValue: true,
                model: propertyModel('row' + modelId + '.Name', name || "Row " + rowIndex)
            },
            {
                displayType: 'Vector2',
                label: "Vector2",
                showValue: true,
                showAxisLabels: true,
                childProperties: {
                    X: {
                        min: -100,
                        max: 100,
                        increment: 0.5,
                        showValue: true,
                        model: propertyModel('row' + modelId + '.Vector2.X', x || -56)
                    },
                    Y: {
                        min: -100,
                        max: 100,
                        increment: 0.5,
                        showValue: true,
                        model: propertyModel('row' + modelId + 'Vector2.Y', y || 96)
                    }
                }
            }
        ];
    }

    var jsonTableRow =  [
        createNewRow(0, "this is my name", 0, 10),
        createNewRow(0, "this is something else", -99, 12)
    ];

    var jsonTableModel = m.property.defaultCollectionModel(jsonTableRow, createNewRow);

    function createNewRowWithHelper (rowIndex, name, vec) {
        modelId++;
        return {
            "Name": props.string('Name', propertyModel('row' + modelId + '.Name', name || "<unknown>")),
            "Vector2": props.vector2('Vector2', propertyModel('row' + modelId + '.Vector2', vec || [99, 66]))
        };
    }

    var jsonTableRowWithHelper =  [
        createNewRowWithHelper(0, "this is my name", 0, 10),
        createNewRowWithHelper(0, "this is something else", -99, 12)
    ];

    var jsonTableModelWithHelper = m.property.defaultCollectionModel(jsonTableRowWithHelper, createNewRowWithHelper);

    var leftModel = {
        editorContext: editorContext,
        categories: [
            {
                label: "Bools",
                properties: [
                    {
                        label: "bool",
                        displayType: 'Boolean',
                        isReadOnly: false,
                        suffixLabel: "ping",
                        showValue: true,
                        model: propertyModel('bool', true)
                    }
                ]
            },
            ////////////////////
            {
                label: "Strings",
                properties: [
                    {
                        label: "string",
                        displayType: 'String',
                        isReadOnly: false,
                        suffixLabel: "pong",
                        showValue: true,
                        model: propertyModel('string', 'this is some serious string')
                    },
                    {
                        label: "multistring",
                        displayType: 'String',
                        isReadOnly: false,
                        showValue: true,
                        isMultiline: true,
                        lineRows: 4,
                        model: propertyModel('multistring', 'this is some serious string'),
                        liveUpdate: true
                    }
                ]
            },
            ////////////////////
            {
                label: "Choices",
                properties: [
                    {
                        label: "choice",
                        displayType: 'Choice',
                        showValue: true,
                        model: propertyModel('choice', 'value3'),
                        options: choiceOptions
                    }
                ]
            },
            ////////////////////
            {
                label: "Numbers",
                properties: [
                    {
                        label: "No Limit",
                        displayType: 'Number',
                        showValue: true,
                        model: propertyModel('number', 42),
                        increment: 1
                    },
                    {
                        label: "Percent [0, 1]",
                        displayType: 'Number',
                        showValue: true,
                        model: propertyModel('percent', 0.4),
                        increment: 0.1,
                        max: 1.0,
                        min: 0.0
                    },
                    {
                        label: "Read only",
                        displayType: 'Number',
                        showValue: true,
                        model: propertyModel('number'),
                        increment: 1,
                        isReadOnly: true
                    }
                ]
            },
            ////////////////////
            {
                label: "Paths",
                properties: [
                    {
                        label: "File",
                        displayType: 'PathProperty',
                        showValue: true,
                        browseType: "File",
                        browseTitle: "Pick an exec",
                        browseFilter: "*.exe",
                        isRightToLeft: true,
                        model: propertyModel('file', 'c:\\Program Files\\iTunes\\iTunes.exe')
                    },
                    {
                        label: "Folder",
                        displayType: 'PathProperty',
                        showValue: true,
                        browseType: "Folder",
                        browseTitle: "Pick a folder",
                        browseFilter: "*.*",
                        suffixLabel: "suffix",
                        model: propertyModel('folder', 'c:\\Program Files')
                    },
                    {
                        label: "Read only",
                        displayType: 'PathProperty',
                        showValue: true,
                        isReadOnly: true,
                        model: propertyModel('folder')
                    }
                ]
            },
            ////////////////////
            {
                label: "Resources",
                properties: [
                    {
                        label: "Material",
                        displayType: 'ResourceProperty',
                        showValue: true,
                        resourceType: "material",
                        hasResourceSelect: true,
                        isRightToLeft: true,
                        isClearableEnabled: true,
                        model: propertyModel('material', '/core/editor_slave/resources/gui/light', true)
                    },
                    {
                        label: "Wwise Event",
                        displayType: 'Element',
                        showValue: true,
                        elementType: "wwise_event",
                        hasElementSelect: true,
                        suffixLabel: "suffix",
                        model: propertyModel('wwise_event', undefined, true)
                    },
                    {
                        label: "Read only",
                        displayType: 'ResourceProperty',
                        resourceType: "material",
                        hasResourceSelect: true,
                        showValue: true,
                        isReadOnly: true,
                        model: propertyModel('material', undefined, true)
                    }
                ]
            },
            ////////////////////
            {
                label: "Sliders",
                properties: [
                    {
                        label: "Big Range [-1000, 1000]",
                        displayType: 'Slider',
                        showValue: true,
                        min: -1000,
                        max: 1000,
                        model: propertyModel('slider', 42),
                        increment: 0.5
                    },
                    {
                        label: "Percent [0, 100]",
                        displayType: 'Slider',
                        showValue: true,
                        model: propertyModel('sliderPercent', 45),
                        increment: 1,
                        suffixLabel: "suffix",
                        max: 100,
                        min: 0.0
                    },
                    {
                        label: "Read only",
                        displayType: 'Slider',
                        showValue: true,
                        model: propertyModel('slider'),
                        increment: 1,
                        isReadOnly: true
                    }
                ]
            },
            ////////////////////
            {
                label: "Ranges",
                properties: [
                    {
                        label: "Range [-100, 100]",
                        displayType: 'RangeProperty',
                        showValue: true,
                        childProperties: {
                            Min: {
                                min: -100,
                                max: 100,
                                increment: 0.5,
                                showValue: true,
                                label: "mini",
                                model: propertyModel('rangeMin', -56)
                            },
                            Max: {
                                min: -100,
                                max: 100,
                                increment: 0.5,
                                showValue: true,
                                label: "maxi",
                                model: propertyModel('rangeMax', 96)
                            }
                        }
                    },
                    {
                        label: "Read Only",
                        displayType: 'RangeProperty',
                        showValue: true,
                        isReadOnly: true,
                        childProperties: {
                            Min: {
                                min: -100,
                                max: 100,
                                increment: 0.5,
                                showValue: true,
                                label: "MIN",
                                model: propertyModel('rangeMin')
                            },
                            Max: {
                                min: -100,
                                max: 100,
                                increment: 0.5,
                                showValue: true,
                                label: "Max",
                                model: propertyModel('rangeMax')
                            }
                        }
                    }
                ]
            },
            ////////////////////
            {
                label: "Vectors",
                properties: [
                    {
                        label: "Vector2",
                        displayType: 'Vector2',
                        showValue: true,
                        showAxisLabels: true,
                        childProperties: {
                            X: {
                                min: -100,
                                max: 100,
                                increment: 0.5,
                                showValue: true,
                                model: propertyModel('vector2X', -56)
                            },
                            Y: {
                                min: -100,
                                max: 100,
                                increment: 0.5,
                                showValue: true,
                                model: propertyModel('vector2Y', 96)
                            }
                        }
                    },
                    {
                        label: "Read Only",
                        displayType: 'Vector2',
                        showValue: true,
                        showAxisLabels: true,
                        isReadOnly: true,
                        childProperties: {
                            X: {
                                min: -100,
                                max: 100,
                                increment: 0.5,
                                showValue: true,
                                model: propertyModel('vector2X', -56)
                            },
                            Y: {
                                min: -100,
                                max: 100,
                                increment: 0.5,
                                showValue: true,
                                model: propertyModel('vector2Y', 96)
                            }
                        }
                    },
                    {
                        label: "Vector3",
                        displayType: 'Vector3',
                        showValue: true,
                        showAxisLabels: true,
                        childProperties: {
                            X: {
                                min: -100,
                                max: 100,
                                increment: 0.5,
                                showValue: true,
                                model: propertyModel('vector3X', 0)
                            },
                            Y: {
                                min: -100,
                                max: 100,
                                increment: 0.5,
                                showValue: true,
                                model: propertyModel('vector3Y', -67)
                            },
                            Z: {
                                min: -100,
                                max: 100,
                                increment: 0.5,
                                showValue: true,
                                model: propertyModel('vector3Z', 84)
                            }
                        }
                    },
                    {
                        label: "Vector3 Locked",
                        displayType: 'Vector3',
                        showValue: true,
                        showAxisLabels: true,
                        supportsLock: true,
                        childProperties: {
                            X: {
                                min: -100,
                                max: 100,
                                increment: 0.5,
                                showValue: true,
                                model: propertyModel('vector3X', 0)
                            },
                            Y: {
                                min: -100,
                                max: 100,
                                increment: 0.5,
                                showValue: true,
                                model: propertyModel('vector3Y', -67)
                            },
                            Z: {
                                min: -100,
                                max: 100,
                                increment: 0.5,
                                showValue: true,
                                model: propertyModel('vector3Z', 84)
                            }
                        }
                    },
                    {
                        label: "Vector4",
                        displayType: 'Vector4',
                        showValue: true,
                        showAxisLabels: false,
                        childProperties: {
                            X: {
                                min: -100,
                                max: 100,
                                increment: 0.5,
                                showValue: true,
                                model: propertyModel('vector4X', -12)
                            },
                            Y: {
                                min: -100,
                                max: 100,
                                increment: 0.5,
                                showValue: true,
                                model: propertyModel('vector4Y', -45)
                            },
                            Z: {
                                min: -100,
                                max: 100,
                                increment: 0.5,
                                showValue: true,
                                model: propertyModel('vector4Z', 23)
                            },
                            W: {
                                min: -100,
                                max: 100,
                                increment: 0.5,
                                showValue: true,
                                model: propertyModel('vector4Z', 56)
                            }
                        }
                    },
                    {
                        label: "RotationProperty",
                        displayType: 'RotationProperty',
                        showValue: true,
                        showAxisLabels: true,
                        childProperties: {
                            XyzEulerX: {
                                increment: 0.5,
                                showValue: true,
                                model: propertyModel('rotationX', 0)
                            },
                            XyzEulerY: {
                                increment: 0.5,
                                showValue: true,
                                model: propertyModel('rotationY', -1.52)
                            },
                            XyzEulerZ: {
                                increment: 0.5,
                                showValue: true,
                                model: propertyModel('rotationZ', 3.14)
                            }
                        }
                    },
                    {
                        label: "Rotation Locked",
                        displayType: 'RotationProperty',
                        showValue: true,
                        showAxisLabels: true,
                        supportsLock: true,
                        childProperties: {
                            XyzEulerX: {
                                increment: 0.5,
                                showValue: true,
                                model: propertyModel('rotationX', 0)
                            },
                            XyzEulerY: {
                                increment: 0.5,
                                showValue: true,
                                model: propertyModel('rotationY', -1.52)
                            },
                            XyzEulerZ: {
                                increment: 0.5,
                                showValue: true,
                                model: propertyModel('rotationZ', 3.14)
                            }
                        }
                    }
                ]
            },
            ////////////////////
            {
                label: "Dicts",
                properties: [
                    {
                        label: "Dictionary",
                        displayType: 'Dictionary',
                        showValue: true,
                        childProperties: {
                            Name: {
                                showValue: true,
                                displayType: "StringProperty",
                                model: propertyModel('d.Name', 'hello'),
                                label: "Name"
                            },
                            D1: {
                                displayType: 'Dictionary',
                                showValue: true,
                                label: "D1",
                                childProperties: {
                                    number: {
                                        displayType: 'Number',
                                        showValue: true,
                                        model: propertyModel('d.D1.number', 34),
                                        label: "number"
                                    },
                                    string: {
                                        displayType: 'String',
                                        showValue: true,
                                        model: propertyModel('d.D1.string', 'ping'),
                                        label: "string"
                                    }
                                }
                            },
                            D2: {
                                displayType: 'Dictionary',
                                showValue: true,
                                label: "D2",
                                childProperties: {
                                    boolean: {
                                        displayType: 'Boolean',
                                        showValue: true,
                                        model: propertyModel('d.D2.boolean', true),
                                        label: "boolean"
                                    },
                                    number: {
                                        displayType: 'Number',
                                        showValue: true,
                                        model: propertyModel('d.D2.number', 45),
                                        label: "number"
                                    }
                                }
                            }
                        }
                    }
                ]
            },
            ////////////////////
            {
                label: "Json",
                properties: [
                    {
                        label: "Json",
                        displayType: 'JsonProperty',
                        showValue: true,
                        data: jsonValue
                    }
                ]
            },
            ////////////////////
            {
                label: "Actions",
                properties: [
                    {
                        label: "Action",
                        displayType: 'ActionProperty',
                        showValue: true,
                        text: "Action",
                        iconName: "fa-star-o",
                        action: function () {
                            console.log('this is an action!');
                        }
                    },
                    {
                        label: "Read Only",
                        displayType: 'ActionProperty',
                        showValue: true,
                        isReadOnly: true,
                        text: "Read Only",
                        iconName: "fa-star-o",
                        action: function () {
                            console.log('this is an action!');
                        }
                    }
                ]
            },
            ////////////////////
            {
                label: "Colors",
                properties: [
                    {
                        label: "Color",
                        displayType: 'ColorProperty',
                        showValue: true,
                        model: propertyModel('color', [1, 1, 1], true)
                    },
                    {
                        label: "Color",
                        displayType: 'ColorProperty',
                        showValue: true,
                        model: propertyModel('color'),
                        isReadOnly: true
                    },
                    {
                        label: "Hdr",
                        displayType: 'HdrColorProperty',
                        showValue: true,
                        model: propertyModel('hdrcolor', [0.5, 0.5, 0.5], true),
                        intensityModel: propertyModel('intensityHdrcolor', 1)
                    },
                    {
                        label: "Hdr ReadOnly",
                        displayType: 'HdrColorProperty',
                        showValue: true,
                        model: propertyModel('hdrcolor', [0.5, 0.5, 0.5], true),
                        intensityModel: propertyModel('intensityHdrcolor', 1),
                        isReadOnly: true
                    }
                ]
            },
            ////////////////////
            {
                label: "Tables",
                properties: [
                    {
                        label: "Table",
                        displayType: 'Table',
                        showValue: true,
                        columns: [
                            {
                                label: "Name",
                                description: "this is the name"
                            },
                            {
                                label: "Position",
                                description: "this is my position"
                            }
                        ],
                        collectionModel: jsonTableModel
                    }
                ]
            },
            ////////////////////
            {
                label: "Gradients",
                properties: [
                    {
                        label: "Gradient",
                        displayType: 'ColorGradient',
                        showValue: true,
                        elements: [
                            createNewGradientElement(0.25, [0.2, 0.5, 0.7]),
                            createNewGradientElement(0.75, [0.5, 0.6, 1])
                        ],
                        createNewElement: createNewGradientElement
                    }
                ]
            }
        ]
    };

    var rightModel = props.editor(editorContext, [
        props.category('Bools', {}, [
            props.bool("bool", propertyModel('bool'), {suffixLabel: "ping"})
        ]),

        props.category('Strings', {}, [
            props.string("string", propertyModel('string'), {
                suffixLabel: "pong"
            }),
            props.string("multistring", propertyModel('multistring'), {
                isMultiline: true,
                lineRows: 4,
                liveUpdate: true
            })
        ]),

        props.category('Choices', {}, [
            props.choice("choice", propertyModel('choice'), choiceOptions, {})
        ]),

        props.category('Numbers', {}, [
            props.number("No Limit", propertyModel('number'), {increment: 1}),
            props.number("Percent [0,1]", propertyModel('percent'), {min: 0, max: 1, increment: 0.1}),
            props.number("Read Only", propertyModel('number'), {isReadOnly: true})
        ]),

        props.category('Paths', {}, [
            props.file("File", propertyModel('file'), "Pick an exec", "*.exe", {isRightToLeft: true}),
            props.directory("Folder", propertyModel('folder'), "Pick a folder", {suffixLabel: "suffix"}),
            props.path("Read Only", propertyModel('folder'), "File", "Pick an exec", "*.exe", {isReadOnly: true})
        ]),

        props.category('Resources', {}, [
            props.resource("Material", propertyModel('material'), "material", {isRightToLeft: true}),
            props.element("Element", propertyModel('wwise_event'), "wwise_event", {isClearableEnabled: false, suffixLabel: "suffix"}),
            props.resource("Read Only", propertyModel('material'), "material", {isReadOnly: true, isClearableEnabled: false})
        ]),

        props.category('Sliders', {}, [
            props.slider("Big Range [-1000, 1000]", propertyModel('slider'), -1000, 1000, 1, {}),
            props.slider("Percent [0, 100]", propertyModel('sliderPercent'), 0, 100, 0.5, {suffixLabel: "suffix"}),
            props.slider("Read Only", propertyModel('slider'), -1000, 1000, 1, {isReadOnly: true})
        ]),

        props.category('Ranges', {}, [
            props.range("Range [-100, 100]", "mini", propertyModel('rangeMin'), 'maxi', propertyModel('rangeMax'), {min: -100, max: 100, increment: 0.5}),
            props.range("Read Only", "MIN", propertyModel('rangeMin'), 'Max', propertyModel('rangeMax'), {min: -100, max: 100, increment: 0.5, isReadOnly: true})
        ]),

        props.category('Vectors', {}, [
            props.vector2("Vector2", propertyModel('vector2', [34, 78]), {min: -100, max: 100, increment: 0.5}),
            props.vector2("Read Only", propertyModel('vector2'), {min: -100, max: 100, increment: 0.5, isReadOnly: true}),

            props.vector3("Vector3", {x: propertyModel('vector3X'),
                y: propertyModel('vector3Y'),
                z: propertyModel('vector3Z'),
                min: -100, max: 100, increment: 0.5}),

            props.vector3("Vector3 Locked", {x: propertyModel('vector3X'),
                y: propertyModel('vector3Y'),
                z: propertyModel('vector3Z'),
                min: -100, max: 100, increment: 0.5,
                supportsLock: true}),

            props.vector4("Vector4", propertyModel('vector4', [34, 78, 67, -90]), {min: -100, max: 100, increment: 0.5, showAxisLabels: false}),

            props.rotation("Rotation", {x: propertyModel('rotationX'),
                y: propertyModel('rotationY'),
                z: propertyModel('rotationZ'),
                increment: 0.5}),

            props.rotation("Rotation Locked", {x: propertyModel('rotationX'),
                y: propertyModel('rotationY'),
                z: propertyModel('rotationZ'),
                increment: 0.5,
                supportsLock: true
            })
        ]),

        props.category('Dicts', {}, [
            props.dictionary("Dictionary", {
                Name: props.string('Name', propertyModel('d.Name')),
                D1: props.dictionary("D1", {
                    number: props.number('number', propertyModel('d.D1.number')),
                    string: props.string('string', propertyModel('d.D1.string'))
                }),
                D2: props.dictionary("D2", {
                    number: props.bool('boolean', propertyModel('d.D2.boolean')),
                    string: props.number('number', propertyModel('d.D2.number'))
                })
            })
        ]),

        props.category('Json', {}, [
            props.json("json", jsonValue)
        ]),

        props.category('Actions', {}, [
            props.action("Action", function () {
                console.log('Action is triggered!');
            }, {iconName: "fa-star-o"}),

            props.action("Read Only", function () {
                console.log('Action is triggered!');
            }, {isReadOnly: true, iconName: "fa-star-o"})
        ]),

        props.category('Colors', {}, [
            props.color("Color", propertyModel('color')),
            props.color("Read Only", propertyModel('color'), {isReadOnly: true}),

            props.hdrColor("Hdr", propertyModel('hdrcolor'), propertyModel('intensityHdrcolor')),
            props.hdrColor("Hdr ReadOnly", propertyModel('hdrcolor'), propertyModel('intensityHdrcolor'), {isReadOnly: true})
        ]),

        props.category('Tables', {}, [
            props.table("Table", [
                    {
                        label: "Name",
                        description: "this is the name"
                    },
                    {
                        label: "Position",
                        description: "this is my position"
                    }
                ],
                jsonTableModelWithHelper)
        ]),

        props.category('Gradients', {}, [
            props.gradient("Gradient", [
                    createNewGradientElement(0.25, [0.2, 0.5, 0.7]),
                    createNewGradientElement(0.75, [0.5, 0.6, 1])
                ],
                {
                    createNewElement: createNewGradientElement
                })
        ])
    ]);

    function propArgsDiv(model) {
        return m('div', {}, [
            PropertyEditor.view(PropertyEditor.controller(model))
        ]);
    }

    function ButtonDiv(text, onClick) {
        return m('div', {style: "margin: 5px;"}, [
            ButtonComponent.component({text: text, onclick: onClick})
        ]);
    }

    var redraw = function () {
        m.utils.redraw();
    };

    var forceRedraw = function () {
        m.utils.redraw('all');
    };

    var MithrilApp = {
        view: function () {
            return m('div', {class:"property-editor-test stingray-panel fullscreen" , style:"display: flex; flex-direction: column; height: 100%"}, [
                m('div', {class: "toolbar"}, [
                    ButtonDiv("Redraw", redraw),
                    ButtonDiv("Force Redraw", forceRedraw)
                ]),
                m('div', {class :"panel-fill panel-flex-horizontal fullscreen", style:"overflow: auto;"}, [
                    m('div', {class: "panel-fill"}, [
                            'Completely manual Property Descriptors',
                            propArgsDiv(leftModel)
                    ]),
                    m('div', {class: "panel-fill"}, [
                            'Property Editor with Helpers',
                            propArgsDiv(rightModel)
                    ])
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
