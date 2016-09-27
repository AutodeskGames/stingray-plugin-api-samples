define([
    'common/lua-utils',
    'services/engine-service',
    'services/engine-viewport-service'
], function () {
    'use strict';

    var luaUtils = require('common/lua-utils');
    var engineService = require('services/engine-service');
    var engineViewportService = require('services/engine-viewport-service');

    var MouseBehavior = function (engineViewportId, engineViewportInterops) {
        this.viewportId = engineViewportId;
        this.engineViewportInterops = engineViewportInterops;
    };

    MouseBehavior.prototype = {
        mouseDown: function (evt) {
            var x = evt.originalEvent.detail.positionX;
            var y = evt.originalEvent.detail.positionY;
            var buttonNumber = evt.originalEvent.detail.button;
            console.log(buttonNumber);

            engineService.sendToLocalEditors('Editor:set_camera_control_style(%s, %s)', luaUtils.toSyntax(this.viewportId), luaUtils.toSyntax("MayaStyleTurntableRotation"));

            switch (buttonNumber) {
                case 0: this.engineViewportInterops.mouseLeftDown(this.viewportId, x, y);
                    break;
                case 1:this.engineViewportInterops.mouseMiddleDown(this.viewportId, x, y);
                    break;
                case 2:this.engineViewportInterops.mouseRightDown(this.viewportId, x, y);
                    break;
            }
        },

        mouseUp: function (evt) {
            var x = evt.originalEvent.detail.positionX;
            var y = evt.originalEvent.detail.positionY;
            var buttonNumber = evt.originalEvent.detail.button;

            engineService.sendToLocalEditors('Editor:set_camera_control_style(%s, %s)', luaUtils.toSyntax(this.viewportId), luaUtils.toSyntax("None"));

            switch (buttonNumber) {
                case 0: this.engineViewportInterops.mouseLeftUp(this.viewportId, x, y);
                    break;
                case 1:this.engineViewportInterops.mouseMiddleUp(this.viewportId, x, y);
                    break;
                case 2:this.engineViewportInterops.mouseRightUp(this.viewportId, x, y);
                    break;
            }
        },

        mouseMove: function (evt) {
            var x = evt.originalEvent.detail.positionX;
            var y = evt.originalEvent.detail.positionY;
            var deltaX = evt.originalEvent.detail.deltaX;
            var deltaY = evt.originalEvent.detail.deltaY;
            this.engineViewportInterops.mouseMove(this.viewportId, x, y, deltaX, deltaY);
        },

        mouseWheel: function (evt) {
            this.engineViewportInterops.mouseWheel(this.viewportId, -evt.originalEvent.deltaY);
        },

        keyDown: function (evt) {
            this.engineViewportInterops.keyDown(this.viewportId, evt.originalEvent.detail.keyCode);
        },

        keyUp: function (evt) {
            this.engineViewportInterops.keyUp(this.viewportId, evt.originalEvent.detail.keyCode);
        },

        viewportResized: function () {

        },

        viewportDrop: function () {

        }
    };

    /**
     * Viewport extension test controller. Implements a viewport extension controller module.
     * @module ViewportExtensionTestController
     */
    var ViewportExtensionTestController = {
        /**
         * Setup the viewport extension controller.
         * @memberof ViewportExtensionTestController#
         * @param {string} engineViewportId - id of the newly created viewport.
         * @param {EngineViewportInterops} engineViewportInterops - engine viewport interop utility class
         */
        setup: function (engineViewportId, engineViewportInterops) {
            this.mouseBehavior = new MouseBehavior(engineViewportId, engineViewportInterops);

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

                return this.mouseBehavior;
            }.bind(this));
        }
    };

    return ViewportExtensionTestController;
});

