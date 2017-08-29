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
    var DefaultMouseBehavior = require('common/default-viewport-mouse-behavior');

    function setImageCursor(body, cursorImage) {
        let imgPath = require.toUrl(`@viewport-extension-test/${cursorImage}.png`);
        let cursorUrl = `url(${imgPath}), auto`;
        setCursor(body, cursorUrl);
    }

    function setCursor(body, cursor) {
        $(body).css('cursor', cursor);
    }

    class MouseBehavior extends DefaultMouseBehavior {
        constructor(engineService, engineViewportId, engineViewportInterops) {
            super(engineService, engineViewportId, engineViewportInterops);
        }

        mouseDown(e, viewportId, x, y) {
            let buttonNumber = e.button;
            this.setCameraControlStyle('MayaStyleTurntableRotation');

            switch (buttonNumber) {
                case 0:
                    this.engineViewportInterops.mouseLeftDown(viewportId, x, y);
                    break;
                case 1:
                    this.engineViewportInterops.mouseMiddleDown(viewportId, x, y);
                    break;
                case 2:
                    this.engineViewportInterops.mouseRightDown(viewportId, x, y);
                    break;
            }
        }

        keyDown(e, viewportId) {
            /*

            // When setting the cursor directly from front end:

            if (e.keyCode === 49) {
                setImageCursor(e.target, 'viewport_behaviors/pan');
            } else if (e.keyCode === 50) {
                setImageCursor(e.target, 'viewport_behaviors/look_around');
            } else if (e.keyCode === 51) {
                setImageCursor(e.target, 'viewport_behaviors/orbit');
            } else if (e.keyCode === 52) {
                setImageCursor(e.target, 'viewport_behaviors/wall');
            } else if (e.keyCode === 53) {
                setCursor(e.target, 'default');
            }
            */

            super.keyDown(e, viewportId);
        }

        mouseUp(e, viewportId, x, y) {
            super.mouseUp(e, viewportId, x, y);
        }

        mouseMove(e, viewportId, x, y, deltaX, deltaY) {
            e.preventDefault();
            this.engineViewportInterops.mouseMove(viewportId, x, y, deltaX, deltaY);
        }
    }

    /**
     * Viewport extension test controller. Implements a viewport extension controller module.
     * @module ViewportExtensionTestController
     */
    class ViewportExtensionTestController extends DefaultViewportController {
        constructor() {
            super(engineService);

            // Reacting to cursor change coming from the engine:
            engineService.addEditorEngineMessageHandler('sync_engine_cursor', (engine, message) => {
                if (this.htmlElement && this.htmlElement.contentDocument) {
                    setImageCursor(this.htmlElement.contentDocument.body, message.cursor);
                }
            });
        }
        /**
         * Setup the viewport extension controller.
         * @memberof ViewportExtensionTestController#
         * @param {string} engineViewportId - id of the newly created viewport.
         * @param {EngineViewportInterops} engineViewportInterops - engine viewport interop utility class
         */
        setup (engineViewportId, engineViewportInterops) {
            super.setup(engineViewportId, engineViewportInterops);

            this.setMouseBehavior(new MouseBehavior(engineService, engineViewportId, engineViewportInterops));

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

