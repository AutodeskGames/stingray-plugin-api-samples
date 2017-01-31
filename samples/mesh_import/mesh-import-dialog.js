/* globals K3D, Stage, Sprite, BitmapData */
define([
    'stingray',
    'attributes/focus-me',
    'common/file-system-utils',
    'extensions/views',
    'services/host-service',
    'services/file-system-service',
    './3rdparty/ivank.js',
    './3rdparty/K3D.js'
], function (stingray) {
    "use strict";

    const views = require('extensions/views');
    const fs = require('services/file-system-service');
    const fsUtils = require('common/file-system-utils');
    const hostService = require('services/host-service');

    var loadedModel = null;
    const fileToImport = stingray.getParameterByName('file');

    var $textureSelect = $('#texture-file');

    /**
     * Called when the 3D model is loaded.
     * @param {object} data - 3D model data.
     */
    function onModelLoaded(data) {
        loadedModel = K3D.parse.fromOBJ(data);

        var stage = new Stage("mesh-preview");
        var s = new Sprite();
        stage.addChild(s);

        var maxX = -99999, maxY = -99999, maxZ = -99999;
        var minX = 99999, minY = 99999, minZ = 99999;
        var barX = 0, barY = 0, barZ = 0;
        for(let i = 0; i < loadedModel.c_verts.length; i+=3) {
            maxX = Math.max(loadedModel.c_verts[i],maxX);
            maxY = Math.max(loadedModel.c_verts[i+1],maxY);
            maxZ = Math.max(loadedModel.c_verts[i+2],maxZ);

            minX = Math.min(loadedModel.c_verts[i],minX);
            minY = Math.min(loadedModel.c_verts[i+1],minY);
            minZ = Math.min(loadedModel.c_verts[i+2],minZ);

            barX += loadedModel.c_verts[i];
            barY += loadedModel.c_verts[i+1];
            barZ += loadedModel.c_verts[i+2];
        }

        var modelWidth = maxX - minX;
        var modelHeight = maxY - minY;
        var nbVerts = loadedModel.c_verts.length / 3;
        barX = barX / nbVerts;
        barY = barY / nbVerts;
        barZ = barZ / nbVerts;

        var scalingX = stage.stageWidth / modelWidth;
        var scalingY = stage.stageHeight / modelHeight;
        var scaling = Math.min(scalingX, scalingY) * 0.5;

        s.x = (stage.stageWidth / 2);
        s.y = (stage.stageHeight / 2);
        s.z = 0;

        s.scaleX = s.scaleY = s.scaleZ = scaling;

        var vts = K3D.edit.unwrap(loadedModel.i_verts, loadedModel.c_verts, 3);

        K3D.edit.transform(vts, K3D.mat.scale(1, -1, 1));
        // I hope its not transforming the real data :S
        K3D.edit.transform(vts, K3D.mat.translate(barX, barY, -barZ));
        var uvt = K3D.edit.unwrap(loadedModel.i_uvt, loadedModel.c_uvt, 2);
        var ind = [];
        for (let i = 0; i < loadedModel.i_verts.length; i++) ind.push(i);

        loadedModel.scaling = scaling / Math.min(maxX, Math.min(maxY, maxZ));

        // Check if we have a texture with the same name
        const imageExtensions = ["jpg", "png", "bmp"];
        Promise.series(imageExtensions, function (tExt, foundTextureFile) {
            if (foundTextureFile)
                return foundTextureFile;
            var textureFile = fsUtils.changeExtension(fileToImport, tExt);
            return fs.pathExists(textureFile).then(function (exists) {
                if (exists)
                    return textureFile;
            });
        }).then(function (textureFile) {

            if (textureFile) {
                s.graphics.beginBitmapFill(new BitmapData(textureFile));
                $textureSelect.text(fsUtils.getFileName(textureFile, false));
            }
            else {
                s.graphics.beginFill(0xFF4444FF, 1.0);
            }

            s.graphics.drawTriangles3D(vts, ind, uvt);

            stage.addEventListener(Event.ENTER_FRAME, function () {
                s.rotationY += 0.01 * (stage.mouseX - stage.stageWidth / 2);
            });

            // Remove ivank global key event handlers
            document.removeEventListener('keydown', null);
            document.removeEventListener('keyup', null);

            // Allow the user to change the texture
            $textureSelect.click(function () {
                hostService.openNativeDialog(hostService.DialogType.OpenFile, null, 'Select texture file',
                    'Texture files|.jpg;.png;.bmp)').then(function(textureFile) {
                    if (!textureFile)
                        return;

                    s.graphics.clear();
                    s.graphics.beginBitmapFill(new BitmapData(textureFile));
                    s.graphics.drawTriangles3D(vts, ind, uvt);
                    $textureSelect.text(fsUtils.getFileName(textureFile, false));
                });
            });
        });
    }

    /**
     * Initialize view
     */
    (function () {
        K3D.load(fileToImport, onModelLoaded);

        var $importName = $('#import-name');

        $importName.val(fsUtils.getFileName(fileToImport, true));

        $("#import-btn").click(function () {
            window.accept({
                name: $importName.val(),
                model: loadedModel
            });
        });

        $("#cancel-btn").click(function () {
            window.reject(views.DialogExecResult.CANCELED);
        });
    }());
});
