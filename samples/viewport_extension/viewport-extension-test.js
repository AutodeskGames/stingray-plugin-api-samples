define(function (require) {
    'use strict';

    const m = require('mithril');
    const EngineViewport = require('components/engine-viewport');
    const engineService = require('services/engine-service');

    const $container = $("#viewport-here");

    let viewportConfig = EngineViewport.config({name: "viewport-extension-test"});

    /**
     * Start - Dynamic productization related stuff
     */
    let loading = false;
    const progressStyle = {
        'width': '100%',
        'height': '100%'    };
    const styles = Object.keys(progressStyle).map(key => `${key}: ${progressStyle[key]}`);
    const loadingScreen = m('div', {
        style: _.join(styles, '; ')
    }, m('img', { src: './waiting.gif', width: '100%', height: '100%' }));

    const renderViewport = () => {
        m.render($container[0], EngineViewport.component(viewportConfig));
    };

    const showProgressBar = () => {
        if (loading)
            return;
        loading = true;
        viewportConfig.destroyViewport();
        m.render($container[0], loadingScreen);
    };
    const showProgressBarDebounced = _.debounce(showProgressBar, 100);

    const hideProgressBar = () => {
        if (!loading)
            return;

        setTimeout(() => {
            loading = false;
            viewportConfig.reset();
            renderViewport();
        }, 800);
    };
    const hideProgressBarDebounced = _.debounce(hideProgressBar, 100);

    engineService.addEngineStartupHandler(() => {
        hideProgressBar();
    });

    engineService.addEngineShutdownHandler(() => {
        showProgressBar();
    });

    engineService.registerOnDataCompileFileStatusChanged(() => {
        // Job started
        showProgressBarDebounced();
    }, () => {
        // Job ended
        hideProgressBarDebounced();
    });
    /**
     * END - Dynamic productization related stuff
     */

    renderViewport();
});
