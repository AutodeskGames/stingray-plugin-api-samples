define(function (require) {
    'use strict';

    const stingray = require('stingray');
    const m = require('properties/mithril-property-ext');
    const PropertyDocument = require('properties/property-document');
    const PropertyEditor = require('properties/property-editor-component');
    const domTools = require('components/dom-tools');
    const ButtonComponent = require('components/button');
    const projectService = require('services/project-service');
    const dataTypeService = require('services/data-type-service');
    const hostService = require('services/host-service');
    const fileSystemService = require('services/file-system-service');

    document.title = 'Mithril Property Editor from type';

    domTools.loadCss('core/css/widgets/json-component.css');
    domTools.loadCss('core/css/widgets/property-editor.css');

    const propertyTextAreaId = 'PropertyTextArea';

    let typeFile = 'No type file loaded';
    let typeFileData = m.prop('');
    let pdoc = null;
    let typeDefinition = null;

    let helperArgs = null;
    function jsonData () {
        return JSON.stringify(pdoc.dataModel, null, 4);
    }

    function load (pathToLoad) {
        let getFilePathPromise = pathToLoad ? Promise.resolve(pathToLoad) : hostService.openNativeDialog(hostService.DialogType.OpenFile, '', 'Select type file', '.type', true);
        return getFilePathPromise.then(function (path) {
            if (!path) {
                return;
            }

            typeFile = path;
            return reloadTypeFile(typeFileData);
        });
    }

     function saveAndReloadTypeFile () {
        if (!typeFile)
            return;

        return fileSystemService.writeFile(typeFile, typeFileData()).then(function () {
            return reloadTypeFile();
        });
    }

    function reloadTypeFile () {
        if (!typeFile)
            return;

        let toLoadFile = typeFile;
        return dataTypeService.resolveTypeFile(toLoadFile).then(function (typeDefinitionArgs) {
            if (!typeDefinitionArgs) {
                typeDefinition = null;
                return;
            }

            if (typeDefinitionArgs.types) {
                typeFile = toLoadFile;
                typeDefinition = typeDefinitionArgs;

                pdoc = new PropertyDocument();

                _.each(typeDefinitionArgs.types, function (typeDesc, typeKey) {
                    let value = dataTypeService.createDefaultValue(typeDesc);
                    let label = typeKey;
                    if (typeDesc.editor && typeDesc.editor.label) {
                        label = typeDesc.editor.label;
                    }

                    pdoc.addCategory(label, {}, value, typeDesc);
                });

                pdoc.on('propertyChanged', function (path, value, property, category, doc) {
                    console.log('onPropertyChanged', path, value, property, category, doc);
                    m.utils.redraw();
                });

                pdoc.on('categoryEnabled', function (path, value, category, doc) {
                    console.log('onCategoryEnabled', path, value, category, doc);
                });

                helperArgs = {
                    document: pdoc,
                    key: stingray.guid()
                };
                return fileSystemService.readFile(typeFile).then(function (content) {
                    typeFileData(content);
                    m.utils.redraw();
                });
            }
        });
    }

    function saveJsonOutput () {
        return hostService.openNativeDialog(hostService.DialogType.SaveFile, '', 'Select value file to save', '', true).then(function (path) {
            if (!path || !pdoc) {
                return;
            }

            fileSystemService.writeJSON(path, pdoc.dataModel);
        });
    }

    function gotoLink(event) {
        event.stopPropagation();
        event.preventDefault();
        hostService.showInExplorer(typeFile);
    }

    function panelDiv() {
        return m('div', {className: 'panel-fill panel-flex-horizontal fullscreen', style: 'overflow: auto;'}, [
            m('div', {className: 'panel-fill'}, [
                m('div', { className: 'toolbar'}, [
                    'Type File Content',
                    ButtonComponent.component({text: 'Save and Reload', onclick: saveAndReloadTypeFile}),
                    ButtonComponent.component({text: 'Reload', onclick: reloadTypeFile})
                ]),
                m('textarea', {className: 'panel-fill', style: 'width: 100%; height: 100%;', value: typeFileData(), onchange: m.withAttr('value', typeFileData)})
            ]),
            m('div', {className: 'panel-fill', key: helperArgs.key}, [
                m('div', { className: 'toolbar'}, [
                    'Property Editor'
                ]),
                PropertyEditor.component(helperArgs)
            ]),
            m('div', {className: 'panel-fill'}, [
                m('div', { className: 'toolbar'}, [
                    'Property Editor',
                    ButtonComponent.component({text: 'Save...', onclick: saveJsonOutput})
                ]),
                m('textarea', {className: 'panel-fill', style: 'width: 100%; height: 100%;', id: propertyTextAreaId, value: jsonData()})
            ])
        ]);
    }

    let MithrilApp = {
        view: function () {
            return m('div', { className: 'property-editor-from-type-component-test stingray-panel fullscreen', style: 'display: flex; flex-direction: column; height: 100%' }, [
                m('div', { className: 'toolbar' }, [
                    ButtonComponent.component({text: 'Load Type', onclick: load}),
                    'Type File:  ',
                    m('a', {href: typeFile, onclick: gotoLink}, typeFile)
            ]),
                m.utils.if(typeDefinition !== null, function(){return panelDiv();})
            ]);
        }
    };

    projectService.relativePathToAbsolute('core/types/all_properties.type').then(filePath => {
        return load(filePath).then(() => {
            // Initialize the application
            m.mount($('#mithril-root')[0], m.component(MithrilApp, {}));
        });
    });

    return {
        noAngular: true
    };

});
