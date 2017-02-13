define([
    'components/mithril-ext',
    'components/button',
    'components/choice'
], function (m, Button, ChoiceComponent) {
    'use strict';
    document.title = "Mithril Choice";

    var getOptions = function () {
        return {
            'A': 1,
            'B': 2,
            'C': 3,
            'D': 4
        };
    };

    var defaultEmptyValueModel = m.helper.modelWithTransformer(m.prop(), null, function (viewStrValue) {
        return parseInt(viewStrValue);
    });
    var valueModel = m.helper.modelWithTransformer(m.prop(2), null, function (viewStrValue) {
        return parseInt(viewStrValue);
    });

    function choiceComponentDiv(title, args, showModelValue) {
        return m('div', {style : "margin: 5px;"}, [
            title,
            m.utils.if(showModelValue, function () {
                return ' (' + valueModel() + ')';
            }),
            ChoiceComponent.component(args)
        ]);
    }

    var MithrilApp = {
        view: function () {
            return m("div", {class: "choice-component-test stingray-panel fullscreen"},[
                m("div", {class: "main-container"}, [
                    choiceComponentDiv("Empty model", {
                        model:  defaultEmptyValueModel,
                        id: 'choice1',
                        name: 'empty model',
                        getOptions: getOptions
                    }),

                    choiceComponentDiv("Default Selection Text", {
                        model:  defaultEmptyValueModel,
                        id: 'choice3',
                        name: 'default selection Text',
                        getOptions: getOptions,
                        defaultValueName: 'Choose an option'
                    }),
                    choiceComponentDiv("Selected Element", {
                        model:  valueModel,
                        id: 'choice2',
                        name: 'selected element',
                        getOptions: getOptions
                    }, true),
                    choiceComponentDiv("Disabled", {
                        model:  valueModel,
                        id: 'choice4',
                        name: 'disabled',
                        getOptions: getOptions,
                        disabled: true
                    }, true)
                ])
            ]
            );
        }
    };

    // Initialize the application
    m.mount($('#mithril-root')[0], m.component(MithrilApp, {}));

    return {
        noAngular: true
    };
});
