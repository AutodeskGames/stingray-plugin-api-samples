/* globals chance */
define([
    'lodash',
    '3rdparty/chancejs/chance.min',
    'common/math-utils',
    'common/keycodes',
    'components/mithril-ext',
    'components/list-view',
    'components/button',
    'components/textbox',
    'components/choice',
    'attributes/clearable'
], function ( _, Chance, mathUtils, keycodes, m, ListViewNewComponent, ButtonComponent, TextBoxComponent, ChoiceComponent) {
    'use strict';

    document.title = "Mithril List View New";

    function editorPath(name) {
        return require.toUrl('stingray-editor') + '/img/' + name;
    }

    function controlPath(name) {
        return require.toUrl('core') + '/img/controls/' + name;
    }

    function iconPath(name) {
        return require.toUrl('core') + '/img/icons/' + name;
    }

    function generateItem(id) {
        var size = chance.integer({min: 1, max: 20000});
        var type = chance.pickone(["anim_clip", "animation", "fbx", "folder", "flow_editor", "ini", "level", "lua",
            "materials", "package", "particles", "physics", "png", "script", "skeleton", "sound", "sound_bank",
            "texture", "tga", "unit"]);

        return {
            id: id,
            name: m.prop(chance.sentence({words: Math.round(Math.random() * 5)})),
            type: type,
            size: size,
            displaySize: mathUtils.bytesToSize(size),
            dateModified: chance.date(),
            url: chance.url(),
            thumbnail: editorPath(type + ".svg"),
            isReadonly: chance.bool(),
            needsSaving: chance.bool(),
            isCompiling: chance.bool()
        };
    }

    function generateItems(nb) {
        var items = [];

        for (var i=0; i<nb; i++){
            items.push(generateItem(i));
        }

        return items;
    }

    // ListView definition
    var columns = [{ // jshint ignore:line
        uniqueId: "isReadonly",
        type: m.column.icon,
        image: iconPath("icon_read_only.svg"),
        property: "isReadonly",
        tooltip: "Read-only",
        defaultWidth: "25",
        header: {
            image: iconPath("icon_read_only_header.svg"),
            tooltip: "Read-only asset bla bla bla...."
        },
        condition: {
            tooltip: "Compiling",
            property: "isCompiling",
            faIcon: "fa-dot-circle-o"
        }
    }, {
        uniqueId: "needsSavingCheckbox",
        type: m.column.checkbox,
        header: { text: "Needs Saving", tooltip: "Sort by Needs Saving" },
        property: "needsSaving",
        tooltipProperty: "needsSaving",
        defaultWidth: "110",
        disabled: function (item) {
            return (item) ?
                (m.utils.isFunction(item.isReadonly) ? item.isReadonly() : item.isReadonly) :
                false;
        }
    }, {
        uniqueId: "name",
        type: m.column.name,
        header: { text: "Name", tooltip: "Sort by Name" },
        property: "name",
        tooltipProperty: "name",
        defaultWidth: "150",
        editable: true,
        editableRejectedCharacters: "[^\/\\?*]"
    }, {
        uniqueId: "type",
        header: { faIcon: "fa-fire", tooltip: "Sort by Type" },
        property: "type",
        defaultWidth: "70"
    }, {
        uniqueId: "size",
        header: "Size",
        property: "size",
        displayProperty: "displaySize",
        defaultWidth: "70",
        dataType: (m.dataType) ? m.dataType.numeric : null
    }, {
        uniqueId: "dateModified",
        header: "Date modified",
        property: "dateModified",
        tooltipProperty: "dateModified",
        defaultWidth: "130"
    }, {
        uniqueId: "url",
        header: "Url",
        property: "url",
        defaultWidth: "100",
        sortable: false
    }];

    var badges = [{ // jshint ignore:line
        tooltip: "Compiling",
        faIcon: "fa-dot-circle-o",
        property: "isCompiling",
        position: m.badgePosition.topLeft,
        customClass: "list-compiling-icon"
    }, {
        tooltip: "Need saving",
        image: controlPath("icon_save.svg"),
        property: "needsSaving",
        position: m.badgePosition.bottomLeft
    }, {
        tooltip: "Read-only",
        image: iconPath("icon_read_only.svg"),
        property: "isReadonly",
        position: m.badgePosition.bottomRight
    }];

    var randomize = function () { // jshint ignore:line
        listView.items = generateItems(parseInt(nbItems()) || 0);
    };

    var toggleFirst = function () { // jshint ignore:line
        var col = listView.layoutOptions.getColumnByUniqueId("isReadonly");
        col.hidden = !col.hidden;
        listView.layoutOptions.notify();
    };

    var onContextMenu = function (type, obj, currentSelection/*, event*/) { // jshint ignore:line
        switch (type) {
            case m.contextMenuType.item:
                var item = obj;
                return [
                    ["Rename", {}, function () {
                        listView.editValue(item, listView.layoutOptions.getColumnByUniqueId("name"));
                    }],
                    null,
                    ["Toggle", {}, function () {
                        item.needsSaving = !item.needsSaving;
                    }],
                    ["Toggle Selected (" + currentSelection.length + ")", {}, function () {
                        for (var i in currentSelection) { // jshint ignore:line
                            currentSelection[i].needsSaving = !currentSelection[i].needsSaving;
                        }
                    }]
                ];

            case m.contextMenuType.background:
                return [
                    ["General option ...", {}, function () {
                        console.debug("General option...");
                    }]
                ];
        }
    };

    var dropConfig = { // jshint ignore:line
        dropTypes: ['file', ListViewNewComponent.mimeType],
        dragOver: function (event, dropData) {
            if (dropData) {
                event.dataTransfer.dropEffect = 'copy';
                return true;
            }
            return false;
        },
        drop: function (event, dropData) {
            if (dropData && event.dataTransfer.files.length > 0) {
                var msg = 'Dropped ' + event.dataTransfer.files.length + ' file(s).\n\n';
                for (var i=0; i< event.dataTransfer.files.length; i++) {
                    msg += event.dataTransfer.files[i].name + '; ';
                }
                alert(msg);
            } else {
                var listViewDragData = dropData[ListViewNewComponent.mimeType].items[0];
                if (listViewDragData.items) {
                    let msg = 'Dropped ' + listViewDragData.items.length + ' item(s).\n\n';
                    for (let i=0; i < listViewDragData.items.length; i++) {
                        msg += listViewDragData.items[i].name + '; ';
                    }
                    alert(msg);
                }
            }
        }
    };

    var itemsDropConfig = { // jshint ignore:line
        dropTypes: ['file', ListViewNewComponent.mimeType],
        dropData: function (event, context) {
            return context.item;
        },
        dragOver: function (event, dropData) {
            // Accept drop only on folders
            if (dropData[0] && dropData[0].item.type === "folder") {
                event.dataTransfer.dropEffect = 'copy';
                return true;
            } else {
                event.dataTransfer.dropEffect = 'none';
                return true;
            }
        },
        highlight: function (event, show, $element) {
            if (show) {
                $element.addClass('drop-hover');
            } else {
                $element.removeClass('drop-hover');
            }
        },
        drop: function (e, dropData) {
            if (dropData && event.dataTransfer.files.length > 0) {
                var msg = 'Dropped ' + event.dataTransfer.files.length + ' file(s).\n\n';
                for (var i=0; i< event.dataTransfer.files.length; i++) {
                    msg += event.dataTransfer.files[i].name + '; ';
                }
                alert(msg);
            } else {
                var listViewDragData = dropData[ListViewNewComponent.mimeType].items[0];
                if (listViewDragData.items) {
                    let msg = 'Dropped ' + listViewDragData.items.length + ' item(s).\n\n';
                    for (let i=0; i < listViewDragData.items.length; i++) {
                        msg += listViewDragData.items[i].name + '; ';
                    }
                    alert(msg);
                }
            }
        }
    };

    var itemsDragConfig = { // jshint ignore:line
        dragData: function (/*event, context*/) {
            return "externalData";
        }
    };

    var listView = ListViewNewComponent.config({
        items: [],
        columns: columns,
        layoutOptions: ListViewNewComponent.toLayoutOptions({
            size: "3",
            filter: ""
        }),
        badges: badges,
        tooltipProperty: "fullPath",
        typedNavigationProperty: "name",
        filterProperty: "name",
        thumbnailProperty: "thumbnail",
        thumbnailTooltipProperty: "type",
        contextClassProperties: ["type", "needsSaving", "isCompiling"],
        defaultSort: {uniqueId: "name", property: "name", reverse: false },
        showHeader: true,
        showLines: false,
        showItemFocus: true,
        allowSort: true,
        allowMultiSelection: true,
        allowColumnResize: true,
        allowArrowNavigation: true,
        allowTypedNavigation: true,
        allowClearSelection: false,
        filterCaseSensitive: false,
        onContextMenu: onContextMenu,
        onSelectionChange: function (newSelection, oldSelection) {
            console.log("Selection changed:", newSelection, oldSelection);
        },
        onDblClick: function (item, event) {
            console.log("Double click:", item, event);
        },
        onLayoutChange: function (layout) {
            console.log("Layout changed:", layout);
        },
        onLoad: function () {
            console.log("Listview loaded:");
            listView.setSelection(items[Math.floor(Math.random() * items.length)]); // jshint ignore:line
        },
        droppable: true,
        dropConfig: dropConfig,
        itemsDroppable: true,
        itemsDropConfig: itemsDropConfig,
        itemsDraggable: true,
        itemsDragConfig: itemsDragConfig
    });

    var getOptions = function () {
        return {
            '0': 0,
            '1': 1,
            '2': 2,
            '3': 3,
            '4': 4,
            '5': 5,
            '6': 6,
            '7': 7
        };
    };

    listView.layoutOptions.size = m.helper.modelWithTransformer(m.prop(3), null, function (sizeValue) {
        return parseInt(sizeValue);
    });

    listView.layoutOptions.filter = m.prop('');

    var searchStringModel = {
        model: listView.layoutOptions.filter,
        liveUpdate: true,
        focusMe: true,
        selectOnClick: true,
        clearable: true,
        placeholder: 'Search here'
    };

    var nbItems = m.helper.notifyingModel(m.prop(200), function (/*currentValue, oldValue*/) {
        randomize();
    });

    var nbItemsModel = {
        model: nbItems,
        liveUpdate: true,
        focusMe: true,
        selectOnClick: true,
        clearable: true
    };

    var MithrilApp = {
        view: function () {
            return m('div', {class: "listview-component-test stingray-panel fullscreen"}, [
                m('div', {class:"fullscreen"}, [
                    m('div', {class: "stingray-panel panel-flex-vertical fullscreen"}, [
                        m('div', {class:"toolbar"}, [
                            m('div', {class: "left-section"}, [
                                ButtonComponent.component({class: "icon-btn fa fa-refresh", onclick:m.redraw, title:"Redraw"}),
                                ButtonComponent.component({class: "icon-btn fa fa-random", onclick:randomize, title:"Randomize data"}),
                                ButtonComponent.component({class: "icon-btn fa fa-adjust", onclick:toggleFirst, title:"Remove first column"}),
                                m('div', {class: "separator"}),
                                "Nb items : ",
                                m('div', {class:"fixed", style:"width: 60px;"}, [
                                    TextBoxComponent.component(nbItemsModel)
                                ])
                            ]),
                            m('div', {class: "right-section"}, [
                                "Filter",
                                TextBoxComponent.component(searchStringModel),
                                m('div', {class:"space1"}),
                                " Size :",
                                m('div', {class:"adsk-select fixed", title:"SelectSize"}, [
                                    ChoiceComponent.component({
                                        model:  listView.layoutOptions.size,
                                        id: 'choice1',
                                        name: 'Size',
                                        getOptions: getOptions
                                    })
                                ])
                            ])
                        ]),
                        m('div', {class:"panel-fill"}, [
                            m('div', {class:"fullscreen stingray-border-dark"}, [
                                ListViewNewComponent.component(listView)
                            ])
                        ])
                    ])
                ])
            ]);
        }
    };

    // Initialize the application
    m.mount($('#mithril-root')[0], m.component(MithrilApp, {}));

    randomize(); //initial population of the listview

    return {
        noAngular: true
    };
});
