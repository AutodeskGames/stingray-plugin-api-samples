define(function (require) {
    'use strict';

    const stingray = require('stingray');
    const mathUtils = require('common/math-utils');
    const assetUtils = require('common/asset-utils');
    const m = require('components/mithril-ext');
    const ListView = require('components/list-view');
    const Toolbar = require('components/toolbar');
    const Button = require('components/button');
    const dreamStatsActions = require('dream-stats/dream-stats-actions');
    const hostService = require('services/host-service');

    const STATS_COLUMN_WIDTH = 40;
    const STATS_MEM_COLUMN_WIDTH = 60;

    function flattenObject (obj, flatObj, prefix) {
        flatObj = flatObj || {};
        _.each(obj, (value, key) => {
            key = prefix ? prefix + '_' + key : key;
            if (_.isPlainObject(value)) {
                flattenObject (value, flatObj, key);
            } else {
                flatObj[key] = value;
            }
        });
        return flatObj;
    }

    function formatMemory (bytes) { return mathUtils.bytesToSize(bytes); }
    //function formatPercent (n) { return (n * 100).toFixed(1) + '%';     }
    function formatTime (n) { return n.toFixed(3) + ' ms'; }

    function createColumn (type, property, width, name, dataType = undefined, format = undefined, onClick = undefined) {
        return {
            type,
            dataType,
            property,
            format,
            onClick,
            uniqueId: property,
            defaultWidth: width,
            header: { text: name, tooltip: `Sort by ${name}`},
        };
    }

    class AssetStatisticsCtrl {
        constructor() {
            this.report = {};
            this.presentedReport = [];

            this.toolbarData = [
                { img: 'arrows-refresh.svg', title: 'Generate...', action: () => this.generateStats() },
                { img: 'open.svg', title: 'Open...', action: () => this.loadStats() },
                { img: 'save.svg', title: 'Save...', action: () => this.saveStats() },
                { img: 'new.svg', title: 'New...', action: () => this.clear() }
            ];

            this.listViewCtrl = ListView.config({
                id: 'allListView',
                items: () => this.presentedReport,
                columns: [
                    createColumn(m.column.name, 'name', 300, 'Name', m.dataType.string, null, item => {
                        return assetUtils.gotoResource(item.name);
                    }),
                    createColumn(m.column.normal, 'render_stats_batches', STATS_COLUMN_WIDTH, 'Batches', m.dataType.numeric),
                    createColumn(m.column.normal, 'render_stats_merged_batches', STATS_COLUMN_WIDTH, 'Merged', m.dataType.numeric),
                    createColumn(m.column.normal, 'render_stats_primitives', STATS_COLUMN_WIDTH, 'Primitives', m.dataType.numeric, v => { return v; }),
                    createColumn(m.column.normal, 'render_stats_cbuffer_memory', STATS_MEM_COLUMN_WIDTH, 'Mem', m.dataType.numeric, formatMemory),
                    //createColumn(m.column.normal, 'render_stats_instance_buffer_size', STATS_MEM_COLUMN_WIDTH, 'Mem (instances)', m.dataType.numeric, formatMemory),
                    //createColumn(m.column.normal, 'render_stats_textures_memory', STATS_MEM_COLUMN_WIDTH, 'Texture', m.dataType.numeric, formatMemory),
                    createColumn(m.column.normal, 'render_stats_cpu', STATS_COLUMN_WIDTH, 'CPU', m.dataType.numeric, formatTime),
                    createColumn(m.column.normal, 'render_stats_gpu', STATS_COLUMN_WIDTH, 'GPU', m.dataType.numeric, formatTime),
                    createColumn(m.column.normal, 'unit_stats_num_nodes', STATS_COLUMN_WIDTH, 'Nodes', m.dataType.numeric),
                    createColumn(m.column.normal, 'unit_stats_num_meshes', STATS_COLUMN_WIDTH, 'Meshes', m.dataType.numeric)
                ],
                layoutOptions: ListView.toLayoutOptions({ size: 4, filter: '' }),
                tooltipProperty: 'name',
                typedNavigationProperty: '*',
                thumbnailProperty: "thumbnail",
                filterProperty: '*',
                defaultSort: {uniqueId: 'name', property: 'name', reverse: false},
                showLines: true,
                showHeader: true,
                showListThumbnails: true,
                allowMultiSelection: false,
                allowMousewheelResize: true,
                hidden: true
            });
        }

        saveStats () {
            return hostService.openNativeDialog(
                hostService.DialogType.SaveFile, '', 'Save Statistics', 'Project Statistics|.project_stats', true
            ).then(saveFilePath => {
                if (!saveFilePath) {
                    return Promise.reject('canceled');
                }

                let jsonString = JSON.stringify(this.report, null, 4);
                stingray.fs.write(saveFilePath, jsonString);
            });
        }

        loadStats () {
            return hostService.openNativeDialog(
                hostService.DialogType.OpenFile, '', 'Open Statistics', 'Project Statistics|.project_stats'
            ).then(statsFilePath => {
                if (!statsFilePath) {
                    return Promise.reject('canceled');
                }

                let content = stingray.fs.read(statsFilePath);
                let jsonContent = JSON.parse(content);
                if (_.isPlainObject(jsonContent)) {
                    this.setReport(jsonContent);
                }
            });
        }

        generateStats () {
            dreamStatsActions.scanAssets().then(report => {
                if (_.isError(report)) {
                    this.clear();
                    return console.error(report);
                }
                this.setReport(report);
            });
        }

        setReport (report) {
            this.report = report;
            this.presentedReport = _.map(report, (assetStats) => flattenObject(assetStats));
            this.listViewCtrl.show(this.presentedReport.length > 0, true);
        }

        clear () {
            this.setReport({});
        }

        view () {
            return m.layout.vertical({}, [
                Toolbar.component({items: this.toolbarData}),
                m.utils.if(!this.presentedReport || this.presentedReport.length === 0, () => {
                    return m(".fullscreen", Button.component({
                        class: 'pos-abs-middle2',
                        style: { "z-index": 0, "margin-top": '-10%', width: 'initial' },
                        text: "Generate stats",
                        onclick: () => this.generateStats()
                    }));
                }),
                m('div', {className: "panel-fill"}, [
                    m('div', {className: "fullscreen stingray-border-dark"}, [
                        ListView.component(this.listViewCtrl)
                    ])
                ])
            ]);
        }
    }

    // Initialize the application
    m.mount($('.main-container')[0], m.component({
        controller: () => new AssetStatisticsCtrl({}),
        view: (ctrl, args) => ctrl.view(args)
    }));

    return {
        noAngular: true
    };
});
