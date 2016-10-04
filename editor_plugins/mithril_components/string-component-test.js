/*global window, console, define, alert, $*/
define([
    'components/mithril-ext',
    'components/textbox',
    'components/button'
], function (m, TextboxComponent, ButtonComponent) {
    'use strict';
    document.title = "Mithril String";

    /*
     {OPTS} :
     [title]: String
     [disabled]: Boolean
     [readOnly]: Boolean
     [placeholder]: String
     [multiLines]: Boolean
     [lineRows]: Integer
     [selectOnClick]: Boolean
     [clearable]: Boolean
     [clearableClass]: String
     [clearableTrigger]: Function
     */

    ////////////////////////////////////////////////
    // Number input textfield

    var textValue = "pow!";
    var textModel = m.prop(textValue);

    var onChangeStringArgs = {
        model: textModel,
        selectOnClick: false
    };

    var liveStringArgs = {
        model: textModel,
        liveUpdate: true,
        focusMe: true,
        selectOnClick: true,
        clearable: true,
        onClear: function () {
            console.warn('content has been cleared!');
        }
    };

    var readOnlyStringArgs = {
        model: textModel,
        readOnly: true
    };

    var index = 0;
    var models = ['ping', 'pong', 'bong', 'bing', 'pow', 'paw'];
    function randomizeModel() {
        index++;
        if (index >= models.length) {
            index = 0;
        }
        textModel(models[index]);

        m.redraw();
    }


    ////////////////////////////////////////////////
    // Number input textfield

    var number1 = m.prop('45.0');
    var numberModel1 = m.helper.numberModel(number1);

    var number1Args = {
        numberModel: numberModel1
    };

    var number2 = m.prop('98.877787');
    var numberModel2 = m.helper.numberModel(number2, -19.0, 198, 3, 0.75);

    var number2Args = {
        numberModel: numberModel2
    };


    function buttonDiv(title, onClick) {
        return m('div', {class: "button", style:'margin: 5px'}, [
            "Model Value:",
            textModel(),
            ButtonComponent.component({text: title, onclick: onClick})
        ]);
    }

    function stringDiv(title, model) {
        return m('div', {class: "", style:'margin: 5px'}, [
            title,
            TextboxComponent.component(model)
        ]);
    }

    function numberTextBoxDiv() {
        return m('div', {class: "", style:'margin: 5px'}, [
            "Number textbox",
            m('div', {style:"margin: 5px;"}, [
                TextboxComponent.component(number1Args),
                "Model Value : ",
                number1()
            ]),
            m('div', {style:'margin: 5px'}, [
                "Number (min: ",
                numberModel2.min,
                " max: ",
                numberModel2.max,
                " step: ",
                numberModel2.increment,
                " decimal: ",
                numberModel2.nbDecimal,
                ")",
                TextboxComponent.component(number2Args),
                "Model Value : ",
                number2()
            ])
        ]);
    }

    var MithrilApp = {
        view: function () {
            return m('div', {class:"stingray-panel fullscreen", style:"margin: 5px;"}, [
                buttonDiv("Randomize Model!",randomizeModel),
                stringDiv("On Change String", onChangeStringArgs),
                stringDiv("Live String", liveStringArgs),
                stringDiv("Read Only String", readOnlyStringArgs),
                m('br'),
                m('br'),
                m('br'),
                numberTextBoxDiv()
            ]);
        }
    };

    // Initialize the application
    m.mount($('#mithril-root')[0], m.component(MithrilApp, {}));

    return {
        noAngular: true
    };
});
