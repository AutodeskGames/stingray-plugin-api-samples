/** global define */
define([
    'app',
    'stingray',
    'lodash',
    'common/profiler'
], function (app, stingray, _, profiler) {
    "use strict";

    document.title = "Profiler Tests";

    /**
     * This plugin showcases all the different APIs used to create an info section in the stingray editor profiler.
     */
    app.controller("profilerController", function ($scope) {

        /**
         * This config will register an info section that contains custom UI (a button) and uses manual update to refresh.
         * Each time the user clicks the button, the profiler will refresh this info section.
         *
         * @type ProfilerInfoConfig
         */
        var profileRequiringManualUpdate = {
            title: "Manual",
            updateCount: 0,
            disable: function () {

            },
            enable: function () {

            },
            render: function ($container, isInit, now) {
                if (isInit) {
                    // Custom UI can be added to the $container. isInit is true the first time $container is created.
                    var $btn = $('<button class="standard-btn">Press me</button>');
                    $btn.click(function (event) {
                        this.updateCount++;
                        profiler.refresh('manual');
                    }.bind(this));
                    $container.append($btn);
                    this.$info = $('<div></div>');
                    $container.append(this.$info);
                }


                var html = "<table>";
                html += "<tr><td>UpdateCount</td>";
                html += '<td class="text-warning">' + this.updateCount + '</td>';
                html += "</tr></table>";
                this.$info.html(html);
            },
            clear: function () {
                this.updateCount = 0;
            }
        };
        profiler.registerInfo('manual', profileRequiringManualUpdate);

        /**
         * This Info shows how to trigger a manual refresh
         * @type ProfilerInfoConfig
         */
        var profileRequiringTickingLoopUpdate = {
            title: "External Ticking",
            updateCount: 0,
            disable: function () {
                clearInterval(this.timer);
                this.timer = null;
            },
            enable: function () {
                // Would have been easier to use the frequency field of the ProfilerInfoConfig :)
                this.timer = setInterval(function () {
                    this.updateCount++;

                    // Manual update for the externalTicking info
                    profiler.refresh('externalTicking');
                }.bind(this), 33);
            },
            render: function ($container, isInit, now) {
                var html = "<table>";
                html += "<tr><td>UpdateCount</td>";
                html += '<td class="text-warning">' + this.updateCount + '</td>';
                html += "</tr></table>";
                $container.html(html);
            },
            clear: function () {
                this.updateCount = 0;
            }
        };
        profiler.registerInfo('externalTicking', profileRequiringTickingLoopUpdate);

        /**
         *  This ProfilerInfoConfig uses the frequency field to be updated each second.
         *
         * @type ProfilerInfoConfig
         */
        var profileTickingEachSecond = {
            title: "Auto Update Each second",
            updateCount: 0,
            frequency: 1000,
            enable: function () {
                this.startTime = Date.now();
            },
            render: function ($container, isInit, now) {
                var html = "<table>";
                html += "<tr><td>UpdateCount</td>";
                html += '<td class="text-warning">' + this.updateCount + '</td>';
                html += "</tr></table>";
                $container.html(html);
                this.updateCount++;
            },
            clear: function () {
                this.updateCount = 0;
            }
        };
        profiler.registerInfo('autoUpdateEachSecond', profileTickingEachSecond);

        /**
         * This ProfilerInfoConfig uses the frequency field to be updated each 5 seconds.
         * @type ProfilerInfoConfig
         */
        var profileTickingEach5Second = {
            title: "Auto Update 5 seconds",
            updateCount: 0,
            frequency: 5000,
            render: function ($container, isInit, now) {
                var html = "<table>";
                html += "<tr><td>UpdateCount</td>";
                html += '<td class="text-warning">' + this.updateCount + '</td>';
                html += "</tr></table>";
                $container.html(html);
                this.updateCount++;
            },
            clear: function () {
                this.updateCount = 0;
            }
        };
        profiler.registerInfo('autoUpdateEach5Second', profileTickingEach5Second);

        function sleep(ms) {
            var d = Date.now();
            while(Date.now() - d < ms) {
                // Wait...
            }
        }

        function getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min)) + min;
        }

        /**
         * This ProfilerInfoConfig uses the performance field to register a new performance counter. The counter is triggered manually.
         * ProfilerInfoConfig
         */
        var profileWithPerfCounter = {
            title: "Performance counters",
            regularId: null,
            disable: function () {
                clearInterval(this.regularId);
                this.regularId = null;
            },
            enable: function () {
                this.regularId = setInterval(function () {
                    // Each second we execute some dummy work what will have a duration of between 80 and 120 ms.
                    // We measure the performance of these units of work and reports stats about it (last, avg, max, count)

                    profiler.startPerformanceMark("perfCounter", "regularTask");
                    sleep(getRandomInt(80,120));
                    profiler.endPerformanceMark("perfCounter", "regularTask");
                }.bind(this), 1000);
            },
            performance: {
                // Performance block only contains a title field.
                regularTask: {
                    title: "Regular Task"
                }
            }
        };
        profiler.registerInfo('perfCounter', profileWithPerfCounter);

        profiler.open();
    });
});
