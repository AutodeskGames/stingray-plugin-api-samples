/*global window, console, define, alert, $*/
define([
    'app',
    'lodash',
    '3rdparty/chancejs/chance.min',
    'common/math-utils',
    'common/keycodes',
    'components/mithril-ext',
    'components/list-view',
    'components/component-harness',
    'attributes/clearable'
], function (app, _, Chance, mathUtils, keycodes, m, ListViewNewComponent) {
    'use strict';

    document.title = "Mithril List View New";
    app.controller('mithrilListViewNewController', function ($scope) {
        $scope.nbItems = 200;

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
            }
        }

        function generateItems(nb) {
            var items = [];

            for (var i=0; i<nb; i++){
                items.push(generateItem(i));
            }

            return items;
        }

        // ListView definition
        $scope.columns = [{
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

        $scope.badges = [{
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

        $scope.redraw = function (size) {
            m.redraw();
        };

        $scope.randomize = function () {
            $scope.listView.items = generateItems($scope.nbItems || 0);
            m.redraw();
        };

        $scope.toggleFirst = function () {
            var col = $scope.listView.layoutOptions.getColumnByUniqueId("isReadonly");
            col.hidden = !col.hidden;
            $scope.listView.layoutOptions.notify();
            m.redraw();
        };

        $scope.onKeyDown = function ($event) {
            switch ($event.keyCode) {
                case keycodes.KEYCODE_ENTER:
                    $scope.listView.dblClick($event);
                    break;
                case keycodes.KEYCODE_UP:
                case keycodes.KEYCODE_DOWN:
                case keycodes.KEYCODE_PAGEUP:
                case keycodes.KEYCODE_PAGEDOWN:
                case keycodes.KEYCODE_HOME:
                case keycodes.KEYCODE_END:
                    $scope.listView.selectByPosition($event.keyCode);
                    $event.preventDefault();
                    return false;
                    break;
            }
            return true;
        };

        var onContextMenu = function (type, obj, currentSelection, event) {
            switch (type) {
                case m.contextMenuType.item:
                    var item = obj;
                    return [
                        ["Rename", {}, function () {
                            $scope.listView.editValue(item, $scope.listView.layoutOptions.getColumnByUniqueId("name"));
                        }],
                        null,
                        ["Toggle", {}, function () {
                            item.needsSaving = !item.needsSaving;
                        }],
                        ["Toggle Selected (" + currentSelection.length + ")", {}, function () {
                            for (var i in currentSelection) {
                                currentSelection[i].needsSaving = !currentSelection[i].needsSaving;
                            }
                        }]
                    ];
                    break;

                case m.contextMenuType.background:
                    return [
                        ["General option ...", {}, function () {
                            alert("General option...");
                        }]
                    ];
                    break;
            }
        };

        var dropConfig = {
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
                        var msg = 'Dropped ' + listViewDragData.items.length + ' item(s).\n\n';
                        for (var i=0; i < listViewDragData.items.length; i++) {
                            msg += listViewDragData.items[i].name + '; ';
                        }
                        alert(msg);
                    }
                }
            }
        };

        var itemsDropConfig = {
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
                        var msg = 'Dropped ' + listViewDragData.items.length + ' item(s).\n\n';
                        for (var i=0; i < listViewDragData.items.length; i++) {
                            msg += listViewDragData.items[i].name + '; ';
                        }
                        alert(msg);
                    }
                }
            }
        };

        var itemsDragConfig = {
            dragData: function (event, context) {
                return "externalData";
            }
        };


        $scope.listView = ListViewNewComponent.config({
            items: [],
            columns: $scope.columns,
            layoutOptions: ListViewNewComponent.toLayoutOptions({
                size: "3",
                filter: ""
            }),
            badges: $scope.badges,
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
                console.log("Selection changed:", newSelection, oldSelection)
            },
            onDblClick: function (item, event) {
                console.log("Double click:", item, event)
            },
            onLayoutChange: function (layout) {
                console.log("Layout changed:", layout);
            },
            onLoad: function () {
                console.log("Listview loaded:");
                $scope.listView.setSelection($scope.items[Math.floor(Math.random() * $scope.items.length)]);
            },
            droppable: true,
            dropConfig: dropConfig,
            itemsDroppable: true,
            itemsDropConfig: itemsDropConfig,
            itemsDraggable: true,
            itemsDragConfig: itemsDragConfig
        });

        $scope.$watch("nbItems", function () {
            $scope.randomize();
        });

        $scope.ListViewNewComponent = ListViewNewComponent;
    });
});
