define(function(require) {
    'use strict';

    document.title = 'Data Editor';

    // Load document editing model APIs
    const documentEditing = require('foundation/document-editing');

    // Register additional supported data storage
    require('foundation/file-system-store');
    const dataServer = require('foundation/data-server-store');
    const projectDatabase = require('foundation/project-store');

    const stingray = require('stingray');
    const m = require('components/mithril-ext');
    const domTools = require('components/dom-tools');

    const dataService = require('services/data-service');
    const hostService = require('services/host-service');

    const props = require('properties/property-editor-utils');
    const PropertyEditor = require('properties/property-editor-component');

    const Journal = dataService.Journal;

    const SupportedExtensions = ["ini", "sjson", "package", "unit", "entity", "component", "aui", "scatter_brush",
                                    "stingray_project"];

    /**
     * Cache the currently loaded DB.
     * @type {Database}
     * @private
     */
    let _currentDb = null;

    /**
     * Data editor widget
     * @property {Asset} asset - Currently displayed asset
     */
    class DataEditor {
        constructor (config) {
            this.db = config.db;
            this.resourceName = config.resourceName;

            this.asset = null;
            this.types = [];
            this.transaction = null;
            this.offChanges = null;

            this.editorContext = props.makeEditorContext();
            this.propertySet = null;
            this.dirty = m.prop(false);
            this.changes = m.prop(false);
            this.canUndo = m.prop(false);
            this.canRedo = m.prop(false);

            //noinspection JSUnresolvedVariable
            /**
             * Various toolbar items.
             * @type {object[]}
             */
            this.actions = [
                { img: "open.svg", title: "Open... (Ctrl-O)", action: DataEditor.open.bind(null, this.db) },
                { id: 'save', img: 'save.svg', title: "Save... (Ctrl-S)", action: () => this.save(), enabled: this.changes },
                { img: 'icon_revert.svg', title: "Discard...", action: () => this.revert(), enabled: this.dirty },
                { separator: true },
                { img: 'undo.svg', title: "Undo previous transaction", action: () => this.undo(), enabled: this.canUndo },
                { img: 'redo.svg', title: "Redo previous rollback", action: () => this.redo(), enabled: this.canRedo },
                { empty_space: true },
                { img: 'find.svg', title: "Notepad", action: () => this.openInNotepad() },
                { img: 'replace.svg', title: "Diff", action: () => this.diffTool() },
                { img: 'icon-settings.png', title: "Select database...",
                    className: "icon-btn right-section.center-toolbar", action: DataEditor.selectDatabase }
            ];

            this.populate();

            document.removeEventListener(documentEditing.EventNames.UNDO, null);

            document.addEventListener(documentEditing.EventNames.UNDO, e => { this.undo(); _.prevent(e); }, true);
        }

        //noinspection JSUnusedGlobalSymbols
        /**
         * Fetch and cache all type descriptor.
         * @return {Promise.<Asset[]>}
         */
        fetchTypeDescriptors () {
            return this.db.get('**/*.type').then(types => this.types = types);
        }

        /**
         * Generate the data editor view.
         */
        populate () {
            let timeLabel = `Build data editor for ${this.resourceName}`;
            console.time(timeLabel);
            this.fetchAsset(this.resourceName)
            .then(() => this.createTransaction())
            .then(transaction => this.generatePropertySet(transaction.assets[0]))
            .then(() => DataEditor.refresh()).then(() => {
                console.timeEnd(timeLabel);
            });
        }

        /**
         * Fetch a specific asset from the DB.
         * @param assetName
         * @return {Promise.<Asset>}
         */
        fetchAsset (assetName) {
            let timeLabel = `Fetch asset ${assetName}`;
            console.time(timeLabel);
            return this.db.get(assetName).spread(asset => {
                if (!asset || !asset.value)
                    throw new Error('Asset not found.');
                if (this.offChanges)
                    this.offChanges();
                this.offChanges = this.db.changes(asset, notifs => this.onChanges(notifs));
                this.asset = asset;
                console.timeEnd(timeLabel);
                return this.asset;
            });
        }

        /**
         * Start a transaction for the edited asset.
         * @return {Promise.<Transaction>}
         */
        createTransaction () {
            this.transaction = this.db.record([this.asset]);
            return this.transaction;
        }

        /**
         * Generate JSON property set from the asset value.
         * @param {Asset} asset - Asset being edited
         * @return {Promise}
         */
        generatePropertySet (asset) {
            if (!asset.value)
                throw new TypeError('No asset value');
            let propertyModel = m.helper.jsonModel(
                asset.value,
                {
                    setValue: (path, value) => this.setValue(path, value),
                    setTransientValue: (path, value)=> this.setValue(path, value, null, true),
                    commitValue: (path, original, value) => this.setValue(path, value, original),
                    renameKey: (oldKey, newKey) => this.renameKey(oldKey, newKey),
                    addProperty: (path, value) => this.addProperty(path, value),
                    deleteProperty: (path, key) => this.deleteProperty(path, key),
                    convertProperty: (path, type) => this.convertProperty(path, type),
                    duplicateProperty: (path, key) => this.duplicateProperty(path, key)
                }

            );

            this.propertySet = props.editor(this.editorContext, [
                props.category(this.resourceName, {}, [
                    props.json("json", this.asset.value, {jsonModel: propertyModel, supportsKeyEditing: true})
                ])
            ]);

            return Promise.resolve(this.propertySet);
        }

        /**
         * Set the property value for a specific property path of the asset value.
         * @param {string} path - Property path to be set.
         * @param {any} value - Property value to be applied.
         * @param {any} [base] - Old value of the property.
         * @param {boolean} [transient] - Indicates if the value is in transit (e.g. we do not log a transaction).
         */
        setValue (path, value, base = null, transient = false) {
            console.debug(`Set${transient ? ' transient' : ''} value \`${path}\`${base ? (' > ' + base) : ''} > ${value}`);
            _.set(this.asset.value, path, value);
            this.transaction.log(`Edit ${path}`, transient).then(() => this.updateStates(true));
        }

        /**
         * Called when an object property name is renamed.
         */
        renameKey (oldPath, newPath) {
            let model = this.asset.value;
            if(newPath.length === 0)
                throw new Error('Empty key are not allowed');
            if (!_.has(model, oldPath))
                throw new Error(`${oldPath} does not exists`);
            if (_.has(model, newPath))
                throw new Error(`${newPath} already exists`);

            _.set(model, newPath, _.cloneDeep(_.get(model, oldPath)));
            _.unset(model, oldPath);

            let msg = `Rename ${oldPath} to ${newPath}`;
            console.debug(msg);
            this.transaction.log(msg).then(() => this.updateStates(true));
        }

        /**
         * Called when a property gets added.
         */
        addProperty (path, value) {
            let model = this.asset.value;
            let parent = _.get(model, path);
            // Generate a unique new path
            let newPath = 'new';
            if (Array.isArray(parent)){
                newPath = m.helper.appendPath(path, parent.length);
            } else {
                newPath = m.helper.appendPath(path, 'new');
                if (_.has(model, newPath)){
                    let uniqueNewPath;
                    //noinspection StatementWithEmptyBodyJS
                    for(let i = 1; _.has(model, uniqueNewPath = `${newPath}${i}`); i++)
                        ;
                    newPath = uniqueNewPath;
                }
            }
            _.set(model, newPath, _.cloneDeep(value));

            let msg = `Add property ${newPath}`;
            console.debug(msg);
            this.transaction.log(msg).then(() => this.updateStates(true));
        }

        /**
         * Called when a property gets deleted.
         */
        deleteProperty (path, key ){
            let model = this.asset.value;
            let parent = _.get(model, path) || model;
            let msg;
            if (!!parent && Array.isArray(parent)){
                parent.splice(key, 1);
                msg = `Remove element ${key} from ${path}`;
            } else {
                delete parent[key];
                msg = `Delete property ${m.helper.appendPath(path, key)}`;
            }
            console.debug(msg);
            this.transaction.log(msg).then(() => this.updateStates(true));
        }

        /**
         * Called when a property value type gets changed.
         */
        convertProperty (path, type) {
            let model = this.asset.value;
            let newValue;
            let oldValue = _.get(model, path);
            let oldType = m.helper.getType(oldValue);
            type = type.toLowerCase();

            if (type === oldType)
                return;

            switch(type){
                case 'number' :
                    newValue = 0;
                    if (oldType === 'string')
                            newValue = parseInt(oldValue) || 0;
                    if (oldType === 'boolean' && oldValue)
                        newValue = 1;
                    break;
                case 'string':
                    newValue = '';
                    if (oldType === 'number')
                        newValue = oldValue + '';
                    break;
                case 'boolean':
                    newValue = oldType === 'number' && oldValue === 1;
                    break;
                case 'object':
                    newValue = {};
                    break;
                case 'array':
                    newValue = [];
                    break;
                default:
                    throw new Error(`'${type}' type is no supported.`);
            }

            _.set(model, path, newValue);

            let msg = `Convert property ${path} to ${type}`;
            console.debug(msg);
            this.transaction.log(msg).then(() => this.updateStates(true));
        }

        /**
         * Called when a property gets duplicated.
         */
        duplicateProperty (path, key) {
            let model = this.asset.value;
            let parent = _.get(model, path);
            // Generate a unique key
            let oldPath = m.helper.appendPath(path, key);
            let newPath;
            if (Array.isArray(parent)) {
                newPath = m.helper.appendPath(path, parent.length);
            } else {
                newPath = m.helper.appendPath(path, `${key}Copy`);
                if (_.has(model, newPath)){
                    let uniqueNewPath;
                    //noinspection StatementWithEmptyBodyJS
                    for(let i = 1; _.has(model, uniqueNewPath = `${newPath}${i}`); i++)
                        ;
                    newPath = uniqueNewPath;
                }
            }
            if (!_.has(model, oldPath))
                throw new Error(`${oldPath} does not exists`);
            // Get the new value
            let value = _.cloneDeep(_.get(model, oldPath));
            // Set the new value
            _.set(model, newPath, value);

            let msg = `Duplicate property ${oldPath} to ${newPath}`;
            console.debug(msg);
            this.transaction.log(msg).then(() => this.updateStates(true));
        }

        /**
         * Check the asset states and update UI actions.
         * @param {boolean} changes - True if some changes need to be reflected.
         */
        updateStates (changes) {
            this.changes(changes);
            this.canRedo(this.transaction.canRedo());
            this.canUndo(this.transaction.canUndo());

            // Check asset state
            this.isDirty().then(dirty => {
                this.dirty(dirty);
                document.updateTabName(this.asset.uri.path(), dirty);
            }).then(DataEditor.refresh);
        }

        /**
         * Checks if the current asset has any diffs.
         * @returns {Promise.<boolean>}
         */
        isDirty () {
            return this.db.diff(this.asset).then(diff => diff.isDirty());
        }

        /**
         * Render data editor.
         */
        render (/*args*/) {
            return m('div.data-editor.stingray-panel.fullscreen', {style:"display: flex; flex-direction: column; height: 100%"}, [
                DataEditor.renderToolbar(this.actions),
                m.utils.if(this.propertySet, () => {
                    return m('div.panel-fill.panel-flex-horizontal.fullscreen', {style:"overflow-x: hidden;"}, [
                        PropertyEditor.component(this.propertySet)
                    ]);
                })
            ]);
        }

        /**
         * Commit the current value to DB.
         * @return {Promise.<Command>}
         */
        save () {
            return this.transaction.commit().catch(err => {
                console.debug(err);
                if (err instanceof Error)
                    throw err;
            }).finally(() => this.updateStates(false));
        }

        /**
         * Undo the last check point in the current transaction.
         */
        undo () {
            return this.transaction.rollback().finally(() => this.updateStates(true));
        }

        /**
         * Redo the previous undo for the current transaction.
         */
        redo () {
            return this.transaction.reroll().finally(() => this.updateStates(true));
        }

        /**
         * Rollback all changes.
         */
        revert () {
            return this.transaction.rollback(Journal.ROLLBACK_ALL).then(() => this.updateStates(false));
        }

        /**
         * Open the current asset in Notepad for testing and comparison.
         */
        openInNotepad () {
            return hostService.startProcess("notepad", [new URL(this.asset.stats.url).pathname.slice(1)]);
        }

        /**
         * Diff the asset file with any git base file.
         */
        diffTool () {
            let filePath = new URL(this.asset.stats.url).pathname.slice(1);
            let gitRootPath = this.findGitRoot(filePath);
            if (!gitRootPath)
                return this.openInNotepad();
            return hostService.startProcess("git", ['difftool', '--no-prompt', stingray.path.relative(gitRootPath, filePath)], {
                WorkingDirectory: gitRootPath
            });
        }

        findGitRoot (path) {
            if (!path)
                return null;
            if (stingray.fs.exists(stingray.path.join(path, '.git')))
                return path;
            return this.findGitRoot(stingray.path.dirname(path));
        }

        onChanges (notif) {
            let hasChanges = this.changes();
            return this.db.get(notif.path).spread(base => {
                return this.db.diff(base, this.asset).then(diff => {
                    if (!diff.isDirty())
                        return;
                    if (!diff.compare(this.asset.value)) {
                        hasChanges = true;
                        let msg = `Apply external changes from ${this.asset.uri.name}`;
                        console.debug(msg);
                        return this.transaction.apply(diff, msg);
                    }
                });
            }).then(() => this.updateStates(hasChanges));
        }

        /**
         * Select a new database.
         */
        static selectDatabase () {
            const ENTER_DB_URL = 'Enter database URL...';
            const SELECT_PROJECT_FILE = 'Browse for .stingray_project...';
            let choices = [ENTER_DB_URL, SELECT_PROJECT_FILE];

            // Load previous choices
            let userDbUrls = window.localStorage.getItem('user_db_urls');
            if (userDbUrls) {
                userDbUrls = JSON.parse(userDbUrls);
                choices = _.uniq(choices.concat(userDbUrls));
            } else {
                userDbUrls = [];
            }

            function selectDbUrl (dbUrl) {
                if (!dbUrl)
                    return Promise.reject('canceled');
                if (dbUrl === ENTER_DB_URL) {
                    return hostService.openModalTextInputDialog(ENTER_DB_URL, projectDatabase.STINGRAY_PROJECT_PROTOCOL, {});
                } else if (dbUrl === SELECT_PROJECT_FILE) {
                    return hostService.openNativeDialog(hostService.DialogType.OpenFile, null, SELECT_PROJECT_FILE,
                        'Stingray Projects|.stingray_project)', true).then(filePath => {
                        if (!filePath)
                            return Promise.reject('canceled');
                        return `${projectDatabase.STINGRAY_PROJECT_PROTOCOL}//${filePath}`;
                    });
                }
                return dbUrl;
            }

            function saveUrl (db) {
                _currentDb = db;
                userDbUrls = _.uniq(userDbUrls.concat([db.url()]));
                window.localStorage.setItem('user_db_urls', JSON.stringify(userDbUrls));
            }

            return hostService.openModalTextPickDialog("Select database...", choices, {width: 450, height: 400})
            .then(selectDbUrl)
            .then(url => url ? url : Promise.reject('canceled'))
            .then(url => DataEditor.loadDb(url))
            .then(saveUrl);
        }

        /**
         * Render the editor main toolbar.
         */
        static renderToolbar (actions) {
            return m('div.toolbar', actions.map(item => {
                if (item.separator) {
                    return m('div', {className: "separator"});
                }

                if (item.empty_space) {
                    return m('div', {className: "right-section"});
                }

                if (item.class) {
                    return m('button', {className: item.class, onclick: item.action, title: item.title},
                        m('img', {src: require.toUrl(`core/img/icons/${item.img}`)})
                    );
                }

                return m('button.icon-btn', {disabled: item.enabled ? !item.enabled() : false, onclick: item.action, title: item.title},
                    m('img', {src: require.toUrl(`core/img/icons/${item.img}`)})
                );
            }));
        }

        /**
         * Mount the database URL.
         * @param {string} url - DB url.
         * @returns {*}
         */
        static loadDb (url) {
            try {
                _currentDb = dataService.mount(url);
                DataEditor.mount(null, _currentDb);
            } catch (err) {
                console.error(err);
                throw err;
            }
            return _currentDb;
        }

        /**
         * Open a new asset.
         * @param {Database} db - Database for which we want to open an asset.
         */
        static open (db) {
            db = db || _currentDb;
            return DataEditor.selectAsset(db).then(assetName => DataEditor.mount(assetName));
        }

        /**
         * Force a UI refresh.
         */
        static refresh () {
            m.utils.redraw('data-editor');
        }

        /**
         * Construct new data editor.
         * @return {DataEditor}
         */
        static controller (config) {
            return new DataEditor(config);
        }

        /**
         * Editor render entry point.
         * @param {DataEditor} ctrl - Editor to be rendered.
         * @param {object} args - Render config
         */
        static view (ctrl, args) {
            return ctrl.render(args);
        }

        /**
         * Mount a data editor at the root of the view.
         * @param {string|null} [assetName] - Resource name to load.
         * @param {Database} [db]
         */
        static mount (assetName, db) {
            let $root = $('#root');
            db = db || _currentDb;
            if (!assetName) {
                document.updateTabName('Select an asset...');
                return m.mount($root[0], m.component({
                    view: () =>
                        m(".fullscreen", [
                            DataEditor.renderToolbar([
                                { img: "open.svg", title: "Open... (Ctrl-O)", action: DataEditor.open.bind(null, null) },
                                { img: 'icon-settings.png', title: "Select database...",
                                    className: "icon-btn right-section.center-toolbar", action: DataEditor.selectDatabase }
                            ]), m.trust('<div class="pos-abs-middle2">Nothing to show</div>')
                        ])
                }));
            }

            document.updateTabResourceName(assetName);
            return m.mount($root[0], m.component(DataEditor, {resourceName: assetName, db}));
        }

        /**
         * Ask the user to select an asset to be loaded for editing.
         * @return {Promise.<string>} Path of the asset.
         */
        static selectAsset (db) {
            return db.info(`**/*.[${SupportedExtensions.join('|')}]`)
                .then(assets => assets.map(asset => asset.uri.path()))
                .then(paths => hostService.openModalTextPickDialog("Select asset for " + db.url(), paths, {width: 450, height: 400}))
                .then(selectedAsset => {
                    if (!selectedAsset)
                        return Promise.reject('canceled');
                    return selectedAsset;
                });
        }

        /**
         * Initialize and run main data editor.
         */
        static run () {
            domTools.loadCss("core/css/widgets/json-component.css");
            domTools.loadCss("core/css/widgets/property-editor.css");

            // Set document editing hooks
            document.getToolName = function () { return 'Data Editor'; };

            // Load main database
            return dataServer.mount(
                dataServer.LOCAL_DATA_SERVER_IP,
                dataServer.LOCAL_DATA_SERVER_PORT,
                dataServer.LOCAL_DATA_SERVER_NAME)
            .then(db => {
                if (db.store.promise)
                    return db.store.promise.then(() => db);
                return db;
            }).then(db => {
                _currentDb = db;

                // Load main editor
                const assetName = stingray.getParameterByName('asset');
                DataEditor.mount(assetName);
            });
        }
    }

    DataEditor.run();
    DataEditor.noAngular = true;

    return DataEditor;
});
