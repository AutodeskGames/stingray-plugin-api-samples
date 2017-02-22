/*global window, console, define, alert, $*/
define([
    'components/mithril-ext',
    'components/slider'
], function (m, SliderComponent) {
    'use strict';
    document.title = "Mithril Slider";

    var defaultValue = m.prop('5');
    var sliderArgs = {
        id: 'choice1',
        min: -100,
        max: 100,
        placeholder: 'Enter value',
        step: 1,
        showLabel: true,
        model: m.helper.numberModel(defaultValue),
        label: 'Default',
    };

    var differentValue = m.prop('90');
    var readonlyArgs = {
        id: 'choice3',
        min: -100,
        max: 100,
        placeholder: 'Enter value',
        step: 1,
        model: m.helper.numberModel(differentValue),
        disabled: true,
        showLabel: true,
        label: 'Read only'
    };

    var bigStepValue = m.prop(10);
    var bigStepArgs = {
        id: 'choice4',
        min: -100,
        max: 100,
        placeholder: 'Enter value',
        step: 10,
        model: m.helper.numberModel(bigStepValue),
        showLabel: true,
        label: 'Big step'
    };

    function sliderDiv(model) {
        return m('div', {class:"slider", style:"margin: 5px;"},
            SliderComponent.component(model)
        );
    }

    var MithrilApp = {
        view: function () {
            return m('div', {class:"stingray-panel fullscreen"}, [
                sliderDiv(sliderArgs),
                sliderDiv(readonlyArgs),
                sliderDiv(bigStepArgs)
            ]);
        }
    };

    // Initialize the application
    m.mount($('#mithril-root')[0], m.component(MithrilApp, {}));

    return {
        noAngular: true
    };
});
