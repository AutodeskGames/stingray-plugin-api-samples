define([
    'properties/mithril-property-ext',
    'properties/property-editor-utils',
    'properties/property-document',
    'properties/property-editor-component',
    'services/data-type-service',
    'services/marshalling-service',
    'services/host-service',
    'services/project-service',
    'services/element-service',
    'services/asset-service',
    'services/file-system-service',
    'components/dom-tools',
    'components/button'
], function (m, props, PropertyDocument, PropertyEditor, dataTypeService, marshallingService, hostService, projectService, elementService,
             assetService, fileSystemService, domTools, ButtonComponent) {
    'use strict';
    document.title = "Mithril Property Editor from type";

    domTools.loadCss("core/css/widgets/json-component.css");
    domTools.loadCss("core/css/widgets/property-editor.css");

    const propertyTextAreaId = "PropertyTextArea";

    var services = {
        marshallingService: marshallingService,
        elementService: elementService,
        projectService: projectService,
        assetService: assetService,
        fileSystemService: fileSystemService
    };

    var editorContext = props.makeEditorContext(services);

    var typeFile = "No type file loaded";
    var typeFileData = m.prop("");
    var pdoc = null;
    var typeDefinition = null;

    var helperArgs = null;
    var jsonData = function () {
        return JSON.stringify(pdoc.dataModel, null, 4);
    };

    var load = function () {
        return hostService.openNativeDialog(hostService.DialogType.OpenFile, "", "Select type file", '*.type', true).then(function (path) {
            if (!path) {
                return;
            }

            typeFile = path;
            reloadTypeFile(typeFileData);
        });
    };

     var saveAndReloadTypeFile = function () {
        if (!typeFile)
            return;

        fileSystemService.writeFile(typeFile, typeFileData()).then(function () {
            reloadTypeFile();
        });
    };

    var reloadTypeFile = function () {
        if (!typeFile)
            return;

        var toLoadFile = typeFile;

        dataTypeService.clear();
        return dataTypeService.resolveTypeFile(toLoadFile).then(function (typeDefinitionArgs) {
            if (!typeDefinitionArgs) {
                typeDefinition = null;
                return;
            }

            if (typeDefinitionArgs.types) {
                typeFile = toLoadFile;
                typeDefinition = typeDefinitionArgs;

                pdoc = new PropertyDocument(editorContext.services.dataTypeService);

                _.each(typeDefinitionArgs.types, function (typeDesc, typeKey) {
                    var value = dataTypeService.createDefaultValue(typeDesc);
                    var label = typeKey;
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

                helperArgs = props.editor(editorContext, pdoc.getCategories());
                fileSystemService.readFile(typeFile).then(function (content) {
                    typeFileData(content);
                });
            }
        });
    };

    var saveJsonOutput = function () {
        return hostService.openNativeDialog(hostService.DialogType.SaveFile, "", "Select value file to save", "", true).then(function (path) {
            if (!path || !pdoc) {
                return;
            }

            fileSystemService.writeJSON(path, pdoc.dataModel);
        });
    };

    function gotoLink(event) {
        event.stopPropagation();
        event.preventDefault();
        hostService.showInExplorer(typeFile);
    }

    function panelDiv() {
        return m('div', {class: "panel-fill panel-flex-horizontal fullscreen", style: 'overflow: auto;'}, [
            m('div', {class: "panel-fill"}, [
                m('div', { class: "toolbar"}, [
                    "Type File Content",
                    ButtonComponent.component({text: "Save and Reload", onclick: saveAndReloadTypeFile}),
                    ButtonComponent.component({text: "Reload", onclick: reloadTypeFile})
                ]),
                m('textarea', {class: "panel-fill", style: "width: 100%; height: 100%;", value: typeFileData(), onchange: m.withAttr('value', typeFileData)})
            ]),
            m('div', {class: "panel-fill"}, [
                m('div', { class: "toolbar"}, [
                    "Property Editor"
                ]),
                PropertyEditor.view(PropertyEditor.controller(helperArgs))
            ]),
            m('div', {class: "panel-fill"}, [
                m('div', { class: "toolbar"}, [
                    "Property Editor",
                    ButtonComponent.component({text: "Save...", onclick: saveJsonOutput})
                ]),
                m('textarea', {class: "panel-fill", style: "width: 100%; height: 100%;", id: propertyTextAreaId, value: jsonData()})
            ])
        ]);
    }

    var MithrilApp = {
        view: function () {
            return m('div', { class: "property-editor-from-type-component-test stingray-panel fullscreen", style: "display: flex; flex-direction: column; height: 100%" }, [
                m('div', { class: "toolbar" }, [
                    ButtonComponent.component({text: "Load Type", onclick: load}),
                    "Type File:  ",
                    m("a", {href: typeFile, onclick: gotoLink}, typeFile)
            ]),
                m.utils.if(typeDefinition !== null, function(){return panelDiv();})
            ]);
        }
    };

    // Initialize the application
    m.mount($('#mithril-root')[0], m.component(MithrilApp, {}));

    return {
        noAngular: true
    };

});
