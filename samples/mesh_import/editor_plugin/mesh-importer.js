/* globals K3D */
define([
    'lodash',
    'common/file-system-utils',
    'extensions/views',
    'services/file-system-service',
    'services/project-service',
    'services/engine-service',
    './3rdparty/K3D'
], function (_) {
    "use strict";

    /** @type {FileSystemService} */
    const fs = require('services/file-system-service');
    const fsUtils = require('common/file-system-utils');

    const views = require('extensions/views');

    /** @type {ProjectService} */
    const projectService = require('services/project-service');

    /** @type {EngineService} */
    const engineService = require('services/engine-service');

    /**
     * Returns a full path resource path.
     * @private
     */
    function _getResFilePath(projectPath, outputDir, name, extension) {
        var inProjectOutputDir = fsUtils.join(projectPath, outputDir);
        return  fsUtils.changeExtension(fsUtils.join(inProjectOutputDir, name), extension);
    }

    /**
     * Exports unit files.
     */
    class UnitExporter {
        constructor() {

        }

        run(modelData, name, projectPath, outputDir) {

            const DEFAULT_RENDERABLE_SETTINGS = {
                always_keep: false,
                culling: "bounding_volume",
                generate_uv_unwrap: false,
                occluder: false,
                shadow_caster: true,
                surface_queries: false,
                viewport_visible: true,
            };

            var unitData = {
                materials: {},
                renderables: {}
            };

            for (var groupName in modelData.groups) {
                if (!modelData.groups.hasOwnProperty(groupName))
                    continue;
                unitData.renderables[groupName] = DEFAULT_RENDERABLE_SETTINGS;
                unitData.materials[groupName] = `${outputDir}/${name}_${groupName}`;
            }

            var unitFilePath = _getResFilePath(projectPath, outputDir, name, "unit");
            return fs.writeJSON(unitFilePath, unitData).then(function () {
                return [unitFilePath];
            });
        }
    }

    /**
     * Exports BSI scenes
     */
    class MeshExporter {
        constructor() {

        }

        run(modelData, name, projectPath, outputDir) {

            var bsiFilePath = _getResFilePath(projectPath, outputDir, name, "bsi");

            function multMatrices(a, b) {
                var result = new Array(16).fill(0);
                for(var k=0; k<=12; k+=4){
                    for(var i=0; i<4; i++){
                        for (var j=0, bCount=0; j<4; j++, bCount+=4){
                            result[k+i] += a[k+j%4] * b[bCount+i%4];
                        }
                    }
                }

                return result;
            }

            var rotMatrix = multMatrices(K3D.mat.rotate(-3.14/2, 0, 0), [
                modelData.scaling, 0, 0, 0,
                0, modelData.scaling, 0, 0,
                0, 0, modelData.scaling, 0,
                0, 0, 0, 1
            ]);

            const I = [
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1
            ];

            var bsiData = {
                geometries: {},
                nodes: {
                    root: {
                        children: {
                        },
                        local: I
                    }
                },
                source_path: bsiFilePath
            };

            for (var groupName in modelData.groups) {
                if (!modelData.groups.hasOwnProperty(groupName))
                    continue;

                var to = modelData.groups[groupName].to;
                var from = modelData.groups[groupName].from;
                var i_verts = modelData.i_verts.slice(from, to);
                var i_uvt = modelData.i_uvt.slice(from, to);
                var i_norms = modelData.i_norms.slice(from, to);
                var c_verts = modelData.c_verts.slice(from, to);
                var c_uvt = modelData.c_uvt.slice(from, to);
                var c_norms = modelData.c_norms.slice(from, to);

                if (c_uvt.length === 0 || i_uvt[0] === null)
                    throw new Error("Invalid texture data");

                const size = to - from;

                bsiData.geometries[groupName] = {
                    indices: {
                        type: "TRIANGLE_LIST",
                        size: size,
                        streams: [i_verts, i_norms, i_uvt]
                    },
                    materials: [{
                        name: groupName,
                        primitives: Array.apply(null, {length: size / 3}).map(Number.call, Number)

                    }],
                    streams: [{
                        channels: [{
                            index: 0,
                            name: "POSITION",
                            type: "CT_FLOAT3"
                        }],
                        data: c_verts,
                        size: c_verts.length / 3,
                        stride: 12
                    }, {
                        channels: [{
                            index: 0,
                            name: "NORMAL",
                            type: "CT_FLOAT3"
                        }],
                        data: c_norms,
                        size: c_norms.length / 3,
                        stride: 12
                    }, {
                        channels: [{
                            index: 0,
                            name: "TEXCOORD",
                            type: "CT_FLOAT2"
                        }],
                        data: c_uvt,
                        size: c_uvt.length / 2,
                        stride: 8
                    }]
                };

                bsiData.nodes.root.children[groupName] = {
                    geometries: [ groupName ],
                    local: rotMatrix,
                    parent: "root"
                };
            }

            return fs.writeJSON(bsiFilePath, bsiData).then(function () {
                return [bsiFilePath];
            });
        }
    }

    /**
     * Exports a standard material
     */
    class MaterialExporter {
        constructor () {
        }

        run (modelData, name, projectPath, outputDir) {

            return Promise.series(modelData.groups, function (groupInfo, results, groupName) {
                var filePath = _getResFilePath(projectPath, outputDir, `${name}_${groupName}`, "material");

                var materialData = {
                    parent_material: "core/stingray_renderer/shader_import/standard",
                    textures: {},
                    variables: {
                        base_color: {
                            type: "vector3",
                            value: [0.431372549019608, 0.431372549019608, 0.431372549019608]
                        },
                        emissive: {
                            type: "vector3",
                            value: [0, 0, 0]
                        },
                        emissive_intensity: {
                            type: "scalar",
                            value: 1,
                        },
                        metallic: {
                            type: "scalar",
                            value: 0
                        },
                        roughness: {
                            type: "scalar",
                            value: 0.33
                        },
                        use_ao_map: {
                            type: "scalar",
                            value: 0
                        },
                        use_color_map: {
                            type: "scalar",
                            value: 0
                        },
                        use_emissive_map: {
                            type: "scalar",
                            value: 0
                        },
                        use_metallic_map: {
                            type: "scalar",
                            value: 0
                        },
                        use_normal_map: {
                            type: "scalar",
                            value: 0
                        },
                        use_roughness_map: {
                            type: "scalar",
                            value: 0
                        }
                    }
                };

                return fs.writeJSON(filePath, materialData).then(function () {
                    results.push(filePath);
                    return results;
                });
            }, []);
        }
    }

    /**
     * Opens the 3D mesh importer dialog.
     * @return {Promise}
     */
    function meshImporterDialog (importOptions, previousResult, file, destination, flags) {
        return views.openDialog('mesh-import-dialog', {
            destination,
            flags,
            importOptions,
            previousResult
        }, {
            file
        });
    }

    /**
     * Import the OBJ mesh and export the corresponding texture, material, unit and bsi files.
     * @return {Promise}
     */
    //noinspection JSUnusedLocalSymbols
    function importMeshFile (importOptions, dialogResult, file, destination/*, flags*/) {
        if (!dialogResult.accepted) {
            return console.warn('Hmm so it did not look that great!?');
        }

        var importData = dialogResult.result;
        if (!importData)
            throw new Error('Nothing to import');

        var modelData = importData.model;
        if (!modelData)
            throw new Error('Invalid model data');

        // Fix import name
        importData.name = importData.name.replace(/[\s+]/gi, "_");

        // Add a default group if none.
        if (_.isEmpty(modelData.groups)) {
            modelData.groups["default"] = {
                from: 0,
                to: modelData.i_verts.length-1
            };
        }

        // Fix any group name
        for (var g in modelData.groups) {
            if (g === "undefined") {
                var b = modelData.groups[g];
                delete modelData.groups[g];
                modelData.groups["default"] = b;
            }
        }

        // TODO: start progress bar
        console.info('Importing `' + file + (destination ? ('` into `' + destination) : '') + '`...');

        var createdFiles = [];
        var exporters = [
            new MaterialExporter(),
            new UnitExporter(),
            new MeshExporter()
        ];

        function _updateImportResult (importResult) {
            createdFiles = createdFiles.concat(importResult);
            return {createdFiles, importResult};
        }

        return projectService.getCurrentProjectPath().then(function (projectPath) {
            return Promise.series(exporters, function (exporter) {
                return exporter.run(modelData, importData.name, projectPath, destination).then(_updateImportResult);
            }).then(function () {
                return createdFiles;
            });
        });
    }

    /**
     * Compiles all the exported data and prints to the user the importation results.
     * @return {Promise}
     */
    //noinspection JSUnusedLocalSymbols
    function printReport (importOptions, importResults, file) {
        if (!importResults)
            return;

        return engineService.compile().then(function (compileResults) {
            console.log('[NOTICE] Successfully imported `' + file + '`');
            for (var f of importResults) {
                console.info('Import created file `' + f + '`');
            }

            return [importResults, compileResults];
        }).catch(function (e) {
            throw new Error(e.Error);
        });
    }

    /**
     * @exports
     */
    return {
        meshImporterDialog,
        importMeshFile,
        printReport
    };
});
