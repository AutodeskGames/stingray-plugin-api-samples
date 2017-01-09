define([
    'common/lua-utils',
    'stingray-editor/global-actions',
    'services/engine-service'
], function (luaUtils, stingrayGlobalActions) {
    'use strict';

    var engineService = require('services/engine-service');

    return {
        initLevelEditorTool: function () {
            return stingrayGlobalActions.loadLuaModule('level_editor_tool/level_editor_tool_behavior');
        },

        smartToolPropertyUpdate: function (path, value) {
            var cmd = `SmartMoveToolCtrl.updateToolProperty(${luaUtils.toSyntax(path)}, ${luaUtils.toSyntax(value)})`;
            return engineService.sendToEditors(cmd);
        }
    };
});

