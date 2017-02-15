/* global define*/
define([
    'components/mithril-ext',
    'components/spinner',
    'common/math-utils',
], function ( m, Spinner) {
    'use strict';

    document.title = "Mithril Spinner";

    const defaultValue = 42.25;
    var sharedModel = m.prop(defaultValue);
    var spinnerArgs = {
        model: sharedModel,
        defaultValue: defaultValue,
        min: -19,
        max: 169,
        increment: 0.75,
        showLabel: true,
        label: "X",
        decimal: 4
    };

    var disabledSpinnerArgs = {
        model: sharedModel,
        defaultValue: defaultValue,
        min: -19,
        max: 169,
        increment: 0.75,
        showLabel: true,
        label: "X",
        decimal: 4,
        disabled: true
    };

    var angledModel = m.prop(defaultValue);
    var AngleSpinnerArgs = {
        model: angledModel,
        defaultValue: defaultValue,
        min: -19,
        max: 169,
        increment: 0.75,
        showLabel: true,
        label: "Z",
        decimal: 4,
        angle: true
    };

    function spinnerDiv (title, model) {
        return m('div', {class: "spinner", style:"margin: 5px;"}, [
            title,
            Spinner.component(model)
        ]);
    }

    var MithrilApp = {
        view: function () {
            return m('div', {class:"spinner-component-test stingray-panel fullscreen"}, [
                spinnerDiv("Mithril Spinner",spinnerArgs),
                spinnerDiv("Mithril Spinner DISABLED", disabledSpinnerArgs),
                spinnerDiv("Mithril Spinner ANGLE", AngleSpinnerArgs)
            ]);
        }
    };

    // Initialize the application
    m.mount($('#mithril-root')[0], m.component(MithrilApp, {}));

    return {
        noAngular: true
    };
});
