define([
    'lodash',
    'components/mithril-ext',
    'components/json-component',
    'components/checkbox',
    'components/dom-tools'
], function ( _, m, JsonComponent, CheckBoxComponent, domTools) {
    'use strict';

    document.title = "Json Component";

    domTools.loadCss("core/css/widgets/json-component.css");

    let dataTemplate = {
        capacity: 10,
        casts_shadows: false,
        float_channels: [
            "age",
            "life",
            "size",
            [
                1,
                2,
                3
            ]
        ],
        object: {
            prop1: "props to you",
            number: 69.69696
        }
    };

    function genBigData (nbTimes) {
        let bigData = {};

        let cloneData = function (value, key, i) {
            let newKey = key + '_' + i;
            bigData[newKey] = _.clone(value, true);
        };

        for (let i = 0; i < nbTimes; ++i) {
            _.each(dataTemplate, (value, key) => {
                cloneData(value, key, i);
            });
        }
        return bigData;
    }

    let nbTemplate = 100;
    let data = genBigData(nbTemplate);

    function countProperty(obj) {
        let count = 0;
        if (_.isArray(obj) || _.isPlainObject(obj)) {
            _.each(obj, function (value) {
                count += countProperty(value);
            });
        } else {
            count = 1;
        }

        return count;
    }

    let templatePropCount = countProperty(dataTemplate);

    let propTotal = m.prop(nbTemplate * templatePropCount);

    let normal = m.prop(true);
    let argsNormal = {
        jsonObj: data,
        defaultCollapsed: false
    };


    function jsonDiv() {
        return m('div', { class:"panel-fill panel-flex-horizontal fullscreen"}, [
            m('div', { class:"panel-fill property-edition adsk-property-object-view"}, [
                JsonComponent.component(argsNormal)
            ])
        ]);
    }

    let MithrilApp = {
        view: function () {
            return m('div', {class: "json-component-test stingray-panel fullscreen"}, [
                m('div', {class: "NbProperties"}, [
                    "Nb Properties: ",
                    propTotal(),
                    " (enable only one side at a time or else you evaluate mithril perf twice)"
                ]),
                m('div', {class:"toolbar"},
                    m('span',{class:"", style:"width: 50%;"}, [
                        CheckBoxComponent.component({model:normal}),
                        " Normal"
                    ])
                ),
                m.utils.if(normal(),function() { return jsonDiv();})
            ]);
        }
    };

    // Initialize the application
    m.mount($('#mithril-root')[0], m.component(MithrilApp, {}));

    return {
        noAngular: true
    };
});
