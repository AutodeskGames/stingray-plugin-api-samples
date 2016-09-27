define(['common/file-system-utils', 'services/data-locator-service', 'services/file-system-service', 'services/host-service', 'services/progress-service'],
    function (fileUtils, dataLocatorService, fileSystemService, hostService, progressService) {
    "use strict";


    return {
        openJsDoc: function () {
            return dataLocatorService.getStingrayRepositoryPath().then(function (repoPath) {
                var jsdocFile = fileUtils.join(repoPath, 'docs', 'output', 'developer', 'plugins', 'index.html');
                return fileSystemService.pathExists(jsdocFile).then(function (exists) {
                    if (exists) {
                        return hostService.startProcess(jsdocFile, [], {
                            UseShellExecute: true,
                            CreateNoWindow: true
                        });
                    }

                    return console.warn("Documentation doesn't exists, generate it first");
                });
            });
        },
        generateJsDoc: function () {
            return dataLocatorService.getStingrayRepositoryPath().then(function (repoPath) {
                console.info('Start Jsdoc generation...');
                return progressService.startTask("jsdoc generation").then(function (reporter) {
                    reporter.Maximum = 7;
                    reporter.Value = 0;
                    var interval = setInterval(function () {
                        if (reporter.Value + 1 >= reporter.Maximum) {
                            reporter.Value += (reporter.Maximum - reporter.Value) / 2;
                        } else {
                            reporter.Value += 1;
                        }
                    }, 1000);
                    function endReport (status) {
                        clearInterval(interval);
                        reporter.invokeMethod("Finish", [status], {});
                    }
                    return reporter.invokeMethod("Start", [], {}).then(function () {
                        return hostService.startProcess('jsdoc', ['-c', 'editor/docs.conf.json'], {
                            UseShellExecute: true,
                            CreateNoWindow: true,
                            WorkingDirectory: repoPath,
                            WaitForExit: false
                        }).then(function (processDesc) {
                            return Promise.on(processDesc, 'ProcessExit', function () {
                                endReport('jsdoc generated');
                            });
                        }).catch(function (err) {
                            endReport('Error generating jsdoc');
                            if (err.message === "The system cannot find the file specified") {
                                console.error("Cannot find jsdoc. Try 'npm install -g jsdoc' at the command line.");
                            } else {
                                console.error(err);
                                throw err;
                            }
                        });
                    });
                });
            });
        },
        generateAndOpenJsDoc: function () {
            this.generateJsDoc().then(function () {
                return this.openJsDoc();
            }.bind(this));
        }
    };
});
