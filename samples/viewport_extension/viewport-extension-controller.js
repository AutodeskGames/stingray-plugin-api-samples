define([
    'common/lua-utils',
    'services/engine-service',
    'services/engine-viewport-service',
    'common/default-viewport-controller'
], function () {
    'use strict';

    var engineService = require('services/engine-service');
    var engineViewportService = require('services/engine-viewport-service');
    var DefaultViewportController = require('common/default-viewport-controller');

    /**
     * Viewport extension test controller. Implements a viewport extension controller module.
     * @module ViewportExtensionTestController
     */
    class ViewportExtensionTestController extends DefaultViewportController {
        constructor() {
            super(engineService);
        }
        /**
         * Setup the viewport extension controller.
         * @memberof ViewportExtensionTestController#
         * @param {string} engineViewportId - id of the newly created viewport.
         * @param {EngineViewportInterops} engineViewportInterops - engine viewport interop utility class
         */
        setup (engineViewportId, engineViewportInterops) {
            super.setup(engineViewportId, engineViewportInterops);

            var off = null;
            return new Promise(function (resolve) {
                off = engineViewportService.on('ViewportCreated', function (id) {
                    if (id === engineViewportId) {
                        resolve();
                    }
                });

                engineViewportService.getViewportNameFromId(engineViewportId).then(function (name) {
                    if (name) {
                        // Viewport has already been created, so no need to wait any longer.
                        resolve();
                    }
                });
            }).then(function () {
                return engineViewportInterops.raise(engineViewportId, 'load_background_level', 'core/editor_slave/resources/levels/empty_level');
            }).then(function () {
                if (off) {
                    off();
                }

                return this;
            }.bind(this));
        }
    }

    return ViewportExtensionTestController;
});

