/*global window, console, define, alert, $*/
define([
    'components/mithril-ext',
    'components/checkbox',
    'components/button',
], function ( m, CheckboxComponent,ButtonComponent) {
    'use strict';
    document.title = "Mithril String";

    var checkedModel = m.prop(true);
    var mixedModel = m.prop(null);

    function toggle () {
        checkedModel(!checkedModel());
    }

    function checkBoxDiv(title, checkBoxArgs) {
        return m('div', {style: "margin: 5px;"}, [
            title,
            CheckboxComponent.component(checkBoxArgs)
        ]);
    }

    function modelValueDiv(title) {
        return m('div', {style: "margin: 5px;"}, [
            title,
            checkedModel(),
            ButtonComponent.component({text: "Toggle Model!", onclick: toggle})
        ]);
    }

    var MithrilApp = {
        view: function () {
            return m("div", {class: "check-component-test stingray-panel fullscreen"},
                m("div", {class: "main-container"}, [
                    modelValueDiv("Model Value: ", {
                        model: checkedModel
                    }),
                    checkBoxDiv("Checkbox", {
                        model: checkedModel
                    }),
                    checkBoxDiv("Mixed", {
                        model: mixedModel
                    }),
                    checkBoxDiv("Disabled", {
                        model: checkedModel,
                        disabled: true
                    })
                ])
            );
        }
    };

    // Initialize the application
    m.mount($('#mithril-root')[0], m.component(MithrilApp, {}));

    return {
        noAngular: true
    };
});
