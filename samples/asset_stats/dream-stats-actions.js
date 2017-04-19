define(function (require) {
    "use strict";

    const stingray = require('stingray');
    const engineService = require('services/engine-service');
    const dataServer = require('foundation/data-server-store');
    const progressService = require('services/progress-service');

    const EVALUATION_TIMEOUT_MS = 3000;
    const SUPPORTED_TYPES = ["unit"];
    const ASSET_TYPES_QUERY = `**/*.[${SUPPORTED_TYPES.join('|')}]`;

    const dbMount = dataServer.mount(
        dataServer.LOCAL_DATA_SERVER_IP,
        dataServer.LOCAL_DATA_SERVER_PORT,
        dataServer.LOCAL_DATA_SERVER_NAME)
    .then(db => {
        if (db.store.promise)
            return db.store.promise.then(() => db);
        return db;
    });

    var nextId = 1;
    var currentRun = null;

    function loadEngineScripts () {
        return engineService.sendToLocalEditors('require "dream_stats/dream-stats"');
    }

    function listAssets() {
        return dbMount.then(db => {
            return db.info(ASSET_TYPES_QUERY).then(assets => assets.map(asset => asset.uri.path()));
        });
    }

    function evaluateAsset (id, assetName) {
        let dirname = stingray.path.dirname(assetName);
        let filename = stingray.path.basename(assetName, false);
        let resourceName = stingray.path.join(dirname, filename);
        let resourceType = stingray.path.suffix(assetName, true);

        return Promise.race([new Promise((resolve, reject) => {
            let off = engineService.addEditorEngineMessageHandler('dream-stats-asset', (engine, message) => {
                if (message.id !== id)
                    return;
                off();
                if (message.err)
                    return reject(new Error(message.err));
                return resolve(message.stats);
            });
            return engineService.sendToLocalEditors(`DreamStats.evaluate(${id}, "${resourceName}", "${resourceType}")`);
        }), Promise.timeout(EVALUATION_TIMEOUT_MS).then(() => {
            throw new Error(`Evaluation for ${assetName} timed out.`);
        })]);
    }

    function batchEvaluateAssets (assetNames, reporter) {
        let assetStats = {};

        let thumbnailOffHandler = engineService.addEditorEngineMessageHandler('thumbnail', (engine, message, data) => {
            if (!assetStats.hasOwnProperty(message.id))
                assetStats[message.id] = {};
            var blob = new Blob([data], {type: 'image/png'});
            assetStats[message.id].thumbnail = window.URL.createObjectURL(blob);
        });

        return engineService.sendToLocalEditors(`DreamStats.start()`).then(() => {
            return Promise.series(assetNames, assetName => {
                let requestId = nextId++;
                return evaluateAsset(requestId, assetName).then(stats => {
                    reporter.Value = reporter.Value + 1;
                    stats.name = assetName;
                    if (!assetStats.hasOwnProperty(requestId))
                        assetStats[requestId] = {};
                    assetStats[requestId] = _.merge(assetStats[requestId], stats);
                });
            });
        }).then(() => {
            return engineService.sendToLocalEditors(`DreamStats.stop()`);
        }).finally((result, err) => {
            thumbnailOffHandler();
            if (err)
                throw err;
            return assetStats;
        });
    }

    function evaluateAssets (assets) {

        return progressService.startTask("Computing asset statistics").then(reporter => {

            reporter.Value = 0;
            reporter.Maximum = assets.length;

            return reporter.invokeMethod("Start", [], {}).then(() => {
                return batchEvaluateAssets(assets, reporter);
            }).finally((result, err) => {
                reporter.invokeMethod("Finish", ['Stats report completed.'], {});
                if (err)
                    throw err;
                return result;
            });
        });
    }

    function scanAssets () {
        if (currentRun)
            return currentRun;
        currentRun = loadEngineScripts()
            .then(listAssets)
            .then(evaluateAssets)
            .finally((result, err) => {
                currentRun = null;
                if (err) {
                    console.error(err.message);
                    throw err;
                }
                return result;
            });
        return currentRun;
    }

    return {
        scanAssets
    };
});

/**
 * @typedef {object} AssetStats
 * @property {number} draw_calls
 */
