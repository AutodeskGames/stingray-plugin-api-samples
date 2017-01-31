define(function (require) {
    'use strict';

    const Plugin = require('foundation/plugin');
    const spmRegistry = require('foundation/spm-registry');
    const hostService = require('services/host-service');

    function downloadAssetPackage() {
        return spmRegistry.getPackages('asset-package').then(packages => {
            if (_.isEmpty(packages))
                return Promise.reject('No asset packages available');
            let choices = packages.map(p => p.name);
            return hostService.openModalTextPickDialog("Select package...", choices, {width: 450, height: 400}).then(selectedName => {
                if (!selectedName)
                    return Promise.reject('canceled');
                let spmAssetPackage = packages.find(p => p.name === selectedName);
                if (!spmAssetPackage)
                    return Promise.reject('Invalid package selection');
                return spmRegistry.downloadPackage(spmAssetPackage.id, spmAssetPackage.downloadUrl, (loaded, total) => {
                    console.log('Downloading...', (loaded / total) * 100);
                }).then(downloadedPackageFiles => downloadedPackageFiles.map(f => Plugin.load(f)));
            });
        })
        .then(assetPackages => Promise.series(assetPackages, p => spmRegistry.installPackage(p)))
        .then(installationFolder => hostService.showInExplorer(installationFolder));
    }

    return {
        downloadAssetPackage
    };
});
