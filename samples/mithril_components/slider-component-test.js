/*global window, console, define, alert, $*/
define([
    'components/mithril-ext',
    'components/slider'
], function (m, SliderComponent) {
    'use strict';
    document.title = "Mithril Slider";

    let defaultValue = m.prop('5');
    let sliderArgs = {
        id: 'choice1',
        min: -100,
        max: 100,
        placeholder: 'Enter value',
        step: 1,
        showLabel: true,
        model: defaultValue,
        label: 'Default'
    };

    let differentValue = m.prop('90');
    let readonlyArgs = {
        id: 'choice3',
        min: -100,
        max: 100,
        placeholder: 'Enter value',
        step: 1,
        model: differentValue,
        disabled: true,
        showLabel: true,
        label: 'Read only'
    };

    let bigStepValue = m.prop(10);
    let bigStepArgs = {
        id: 'choice4',
        min: -100,
        max: 100,
        placeholder: 'Enter value',
        step: 10,
        model: bigStepValue,
        showLabel: true,
        label: 'Big step'
    };

    function sliderDiv(model) {
        return m('div', {className:"slider", style:"margin: 5px;"},
            SliderComponent.component(model)
        );
    }

    let MithrilApp = {
        view: function () {
            return m('div', {className:"stingray-panel fullscreen"}, [
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
