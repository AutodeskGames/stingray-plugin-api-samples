define(['common/file-system-utils', 'services/file-system-service', 'services/asset-service', 'services/project-service', 'services/level-editing-service'
], function (fileUtils, fileSystemService, assetService, projectService, levelEditingService) {
    "use strict";

    function _getLineColInBuffer(text, index, tabSpaceCount) {
        var cursor = 0;
        var row = 1, col = 0;
        var next = 0;
        tabSpaceCount = tabSpaceCount || 4;
        while (1) {
            next = text.regexIndexOf(/\n/, cursor);
            if (next === -1) {
                next = text.length;
            }
            if (next < index) {
                row++;
            } else {
                var tabsToSpaceCount = (text.substring(cursor, next).match(/\t/g) || []).length * tabSpaceCount;
                col = (index - cursor) + tabsToSpaceCount + 1;
                break;
            }
            cursor = next+1;
        }

        return {
            row: row,
            col: col
        };
    }

    function patchLuaFiles(projectPath) {
        console.info('Patching lua files in ' + projectPath);

        return fileSystemService.enumerateFiles(projectPath, "*.lua", true).then(function (luaFiles) {
            return Promise.all(luaFiles.map(function (luaFilePath) {
                return fileSystemService.readFile(luaFilePath).then(function (text) {
                    var match, matches = {
                        file: luaFilePath,
                        found: []
                    };
                    var re = /PlayerHud/g;
                    while ((match = re.exec(text)) !== null) {
                        var rowCol = _getLineColInBuffer(text, match.index);
                        //console.info('Found a match at ' + luaFilePath + ':' + rowCol.row + ':' + rowCol.col);
                        matches.found.push({file: luaFilePath, row: rowCol.row, col: rowCol.col});
                    }
                });
            }));
        });
    }

    return {
        createIniAsset: function (name, dir, templateArgs) {
            console.warn('Script arguments', templateArgs);
            assetService.getAssetUniqueName(dir, 'ini', name).then(function (uniqueName) {
                projectService.getCurrentProjectPath().then(function (projectPath) {
                    var iniFileName = fileUtils.join(projectPath, dir, uniqueName+'.ini');
                    console.warn('Writing file ' + iniFileName, uniqueName);
                    fileSystemService.writeJSON(iniFileName, templateArgs).then(function () {
                        console.warn('File written', iniFileName);
                    }, console.error.bind(console, 'Failed to write file...'));
                });
            });
        },

        test: function () {
            console.warn('patch that does not do anything');
            return Promise.resolve({dummy: "content"});
        },

        fail: function () {
            return Promise.reject('failed to apply this patch');
        },

        isReadOnly: function (/* filePath */) {
            return false;
        },

        checkout: function (filePath) {
            console.log('fake checkout ', filePath);
        },

        duplicateLevelObjects: function (/*levelObjects*/) {
            levelEditingService.cloneSelection();
        },

        patchLuaFiles: patchLuaFiles
    };
});
