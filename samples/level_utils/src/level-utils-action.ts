import stingray = require("stingray");
import hostService = require('services/host-service');
import dataServer = require('foundation/data-server-store');
import fileSystemUtils = require ('common/file-system-utils');
import marshallingService = require('services/marshalling-service');
import levelEditingService = require('services/level-editing-service');
import projectService = require("services/project-service");
import { AssetUri } from 'services/data-service';

import _ = require('lodash');

const _levelSelector = '**/*.level';

const engineUnitPropertyPath = 'units';
const editorUnitPropertyPath = 'editor_metadata.Units';

const editorScatterPropertyPath = 'editor_metadata.Scatter.ScatterData';
const engineScatterPropertyPath = 'scatter';
const engineScatterIdPath = 'groups';

let _db = null;
let _levels: Level[];

let savedEditorTransform = null;
let savedEngineTransform = null;

class Level {
    private levelData: any; //raw info from the db
    private levelInfo: any; //the actual object that contains the info on the units in the level
    private editorUnits: EditorUnit[];
    private engineUnits: EngineUnit[];
    private editorScatterData: any;
    private engineScatterData: any;
    readonly levelName: string;

    constructor (levelData: any) {
        this.levelData = levelData;
        this.levelName = levelData.uri.name;
        this.levelInfo = levelData.value;
        this.editorScatterData = _.get(this.levelInfo, editorScatterPropertyPath);
        this.engineScatterData = _.get(this.levelInfo, engineScatterPropertyPath);

        let rawEditorUnitDataArray = _.get(this.levelInfo, editorUnitPropertyPath);
        this.editorUnits = []; //clearing
        for(let rawUnitData of rawEditorUnitDataArray) {
             this.editorUnits.push(new EditorUnit(rawUnitData));
        }

        let rawEngineUnitDataArray = _.get(this.levelInfo, engineUnitPropertyPath);
        this.engineUnits = []; //clearing
        for(let rawUnitData of rawEngineUnitDataArray) {
             this.engineUnits.push(new EngineUnit(rawUnitData));
        }
    }

    getLevelInfo():any {
        return this.levelInfo;
    }

    getLevelData():any {
        return this.levelData;
    }

    getAllEditorUnitsInLevel(): EditorUnit[] {
        return this.editorUnits;
    }

    getAllEngineUnitsInLevel(): EngineUnit[] {
        return this.engineUnits;
    }

    getUnitInstancesAmount(): Number {
        let count = 0;
        for(let units of this.levelInfo.values()) {
            count += units.length;
        }

        return count;
    }

    getUnitsOfResource(resourceName: string): Unit[] {
        let unitsOfResourceInLevel: Unit[] = [];
        let unitsInLevel = this.getAllEditorUnitsInLevel();
        for(let unit of unitsInLevel) {
                let unitType = unit.getUnitProperty('Type');
                if(_.includes(unitType,resourceName)) {
                    unitsOfResourceInLevel.push(unit);
                }
            }
        return unitsOfResourceInLevel;
    }

    deleteScatterData(unitIds: string): void {
         for(let engineScatterData of this.engineScatterData) {
            let groups = _.get(engineScatterData, engineScatterIdPath);
            for(let id of unitIds) {
                if(_.has(groups,id)) {
                    delete groups.id; //TODO: need to find a better way to delete
                    break;
                }
            }
        }

        for(let id of unitIds) {
            if(_.has(this.editorScatterData,id)) {
                delete this.editorScatterData.id; //TODO: need to find a better way to delete
                break;
            }
        }
    }

    removeUnit(unitTypeToRemove: string) {
        let editorUnits = this.getAllEditorUnitsInLevel();
        let removedEditorUnits: EditorUnit[] = [];
        removedEditorUnits = _.remove(editorUnits, (editorUnit: EditorUnit) => {
            return editorUnit.getType() === unitTypeToRemove;
        });

        let engineUnits = this.getAllEngineUnitsInLevel();
        let removedEngineUnits: EngineUnit[] = [];
        removedEngineUnits = _.remove(engineUnits, (engineUnit: EngineUnit) => {
            return engineUnit.getType() === unitTypeToRemove;
        });

        if(removedEditorUnits.length !== removedEngineUnits.length) {
            console.error("ERROR IN UNIT DELETION, AMOUNT OF EDITOR AND ENGINE UNITS.");
        }

        this.removeUnitData(unitTypeToRemove, removedEditorUnits, removedEngineUnits);
    }

    private removeUnitData(unitTypeToRemove: string, removedEditorUnits:EditorUnit[], removedEngineUnits:EngineUnit[]) {
        let findUnitData = function (rawUnit: any, units: Unit[]): Boolean {
            return _.find(units, (unit: Unit) => {
                return unit.getId() === rawUnit.id || unit.getId() === rawUnit.Id; //TODO: improve
            });
        }

        let rawEngineUnitDataArray = _.get(this.levelInfo, engineUnitPropertyPath);
        _.remove(rawEngineUnitDataArray, engineUnit => {
            return engineUnit.type === unitTypeToRemove && findUnitData(engineUnit, removedEngineUnits);
        });

        let rawEditorUnitDataArray = _.get(this.levelInfo, editorUnitPropertyPath);
        _.remove(rawEditorUnitDataArray, editorUnit => {
            return editorUnit.Type === unitTypeToRemove && findUnitData(editorUnit, removedEditorUnits);
        });
    }

    getEditorUnitInLevel(id): EditorUnit {
        return _.find(this.editorUnits, (editorUnit: EditorUnit) => {
            return editorUnit.getId() === id;
        });
    }

    getEngineUnitInLevel(id): EngineUnit {
        return _.find(this.engineUnits, (engineUnit: EngineUnit) => {
            return engineUnit.getId() === id;
        });
    }
}

class Unit {
    protected unitData: any;
    protected type: string;
    protected id: string;
    protected name: string;
    protected transform: Transform;

    constructor (unitData: any) {
        this.unitData = unitData;
    }

    getUnitProperty(prop: string) {
        return _.get(this.unitData, prop);
    }

    setUnitProperty(prop: string, value: string) {
        return _.set(this.unitData, prop, value);
    }

    getType(): string {
        return this.type;
    }

    getId(): string {
        return this.id;
    }

    getName(): string {
        return this.name;
    }

    getTransform(): Transform {
        return this.transform;
    }

    setTransform(pos:string, rot:string, scale:string, pivot?:string):void {
        this.transform.pos = pos;
        this.transform.rot = rot;
        this.transform.scale = scale;
        this.transform.pivot = pivot;
    }
}

class EditorUnit extends Unit {

    private readonly _positionPropName:string = 'Pos';
    private readonly _rotationPropName:string = 'Rot';
    private readonly _scalePropName:string = 'Scl';
    private readonly _pivotPropName:string = 'Pivot';

    constructor (unitData: any) {
        super(unitData);
        this.type = _.get(unitData, 'Type');
        this.id = _.get(unitData, 'Id');
        this.name = _.get(unitData, 'Name');
        this.transform = new Transform(this.getUnitProperty(this._positionPropName), this.getUnitProperty(this._rotationPropName), this.getUnitProperty(this._scalePropName),this.getUnitProperty(this._pivotPropName));
    }

    stringifyEditorTransformValues(transformProperty: string): string {
        let prop = this.getUnitProperty(transformProperty);
        return 'X: ' + prop.X + ', Y: '+ prop.Y + ', Z: ' + prop.Z;
    }

    setType(newType: string): string {
        this.type = newType;
        this.unitData.Type = this.type;
        return this.type;
    }

    setTransform(pos:string, rot:string, scale:string, pivot:string):void {
        super.setTransform(pos, rot, scale, pivot);

        this.setUnitProperty(this._positionPropName, this.transform.pos);
        this.setUnitProperty(this._rotationPropName, this.transform.rot);
        this.setUnitProperty(this._scalePropName, this.transform.scale);
        this.setUnitProperty(this._pivotPropName, this.transform.pivot);
    }
}

class EngineUnit extends Unit {

    private readonly _positionPropName:string = 'pos';
    private readonly _rotationPropName:string = 'rot';
    private readonly _scalePropName:string = 'scl';

    constructor (unitData: any) {
        super(unitData);
        this.type = _.get(unitData, 'type');
        this.id = _.get(unitData, 'id');
        this.name = _.get(unitData, 'name');
        this.transform = new Transform(this.getUnitProperty(this._positionPropName), this.getUnitProperty(this._rotationPropName), this.getUnitProperty(this._scalePropName), 'NO PIVOT ON ENGINE UNITS');
    }

    stringifyEditorTransformValues(transformProperty: string): string {
        return "TODO"; //TODO
    }

    setType(newType: string): string {
        this.type = newType;
        this.unitData.type = this.type;
        return this.type;
    }

    setTransform(pos:string, rot:string, scale:string):void {
        super.setTransform(pos, rot, scale);

        this.setUnitProperty(this._positionPropName, this.transform.pos);
        this.setUnitProperty(this._rotationPropName, this.transform.rot);
        this.setUnitProperty(this._scalePropName, this.transform.scale);
    }
}

class Transform {
    pivot: any;
    pos: any;
    rot: any;
    scale: any;
    constructor (pos: any, rot:any, scale: any, pivot: any) {
        this.pos = pos;
        this.rot = rot;
        this.scale = scale;
        this.pivot = pivot;
    }

    returnPropAsArray(prop: any): any {
        let transformProp = this[prop];

        if(_.isUndefined(transformProp))
            return; // need to shoot error message

        if(Array.isArray(transformProp)) {
            return transformProp;
        }
        else if (prop == 'rot') {
            return [transformProp.X, transformProp.Y, transformProp.Z, transformProp.W];
        }
        else {
            return [transformProp.X, transformProp.Y, transformProp.Z];
        }
    }
}

class UnitsInLevelSearchResult {
    level: Level;
    units: Unit[];
    selectedResourceName: string;
    unitType: string; //units in a UnitsInLevelSearchResult should all have the same type

    constructor (level: Level, units: Unit[], selectedResourceName: string) {
        this.level = level;
        this.units = units;
        this.selectedResourceName = selectedResourceName;
        this.unitType = _.first(units).type;
    }
}

class TransformReturnResult {
    editorTransform: Transform;
    engineTransform: Transform;

    constructor (editorT: Transform, engineT: Transform) {
        this.editorTransform = editorT;
        this.engineTransform = engineT;
    }
}

function saveChangesToLevels(levels: Level[]) {
    return Promise.all(levels.map((level: Level) => {
        return _db.commit(level.getLevelData());
    }));
}

function initDataServerDb () {
    return dataServer.mount(
        dataServer.LOCAL_DATA_SERVER_IP,
        dataServer.LOCAL_DATA_SERVER_PORT,
        dataServer.LOCAL_DATA_SERVER_NAME)
        .then(db => {
            if (db.store.promise) {
                return db.store.promise.then(() => db);
            }
            return db;
        });
}

// exported for unit testing purposes
export function getLevelsForTests(assetSelector, db) {
    return getLevelFromDB(assetSelector, db);
}

function getLevel (levelName: AssetUri) {
    return initDataServerDb().then(db => {
        _db = db;
        return _db.get(levelName).then(levels => {
            return new Level(_.first(levels));
        });
    });
}

function reloadCurrentLevel() {
    return marshallingService.requestRemoteObject('Stingray.LevelEditingService', null, null, {propertyPath: {'EditedLevel': {'ResourceName': '*'}}}).then(_levelEditingService => {
        let levelName = _levelEditingService.EditedLevel.ResourceName;
        return projectService.getCurrentProjectPath()
        .then(projectPath => stingray.path.join(projectPath, levelName))
        .then(absoluteLevelPath => levelEditingService.loadLevel(absoluteLevelPath + '.level'));
    });
}

function getLevelFromDB(levelSelector: string, db:any):Promise<Level[]> {
    return db.get(levelSelector).then(levels => {
        return levels;
    }).then(levels => {
        _levels = [];
        for(let level of levels) {
            _levels.push(new Level(level));
        }
        return _levels;
    });
}

function getLevels () {
    return initDataServerDb().then(db => {
        _db = db;
        return getLevelFromDB(_levelSelector, _db);
    });
}

function getAllEditorUnitsInAllLevels(levels): EditorUnit[] {
    let unitsInLevel: EditorUnit[] = [];
    _.forOwn(levels, level => {
        unitsInLevel = unitsInLevel.concat(level.getAllEngineUnitsInLevel());
    });

    return unitsInLevel;
}

function getUnitInLevels(dialogTitle: string, levels:Level[]): Promise<UnitsInLevelSearchResult[]> {

    let units = getAllEditorUnitsInAllLevels(levels);
    let unitTypes = _.map(units, unit => {
        return unit.getType();
    });
    let unitFilePaths = _.uniq(unitTypes);
    unitFilePaths = _.map(unitFilePaths , filePath => {
        return filePath + '.unit';
    });

    return hostService.openModalTextPickDialog(dialogTitle, unitFilePaths, {width: 450, height: 400})
    .then( (selectedResourceName: string): UnitsInLevelSearchResult[] => {
        return getUnitsInLevelsByName(selectedResourceName, levels);
    });
}

// exported for unit testing purposes
export function getUnitsInLevelsByName(selectedResourceName: string, levels:Level[]) : UnitsInLevelSearchResult[] {
    if (!selectedResourceName) {
        Promise.reject(null);
        return [];
    }

    console.info("Searching for levels containing: " + selectedResourceName);
    let selectedResourceNameNoExt = fileSystemUtils.getFilePathWithoutExtension(selectedResourceName);
    let unitsInLevelSearchResults: UnitsInLevelSearchResult[] = [];
    for(let level of levels) {
        let unitsFromResourceInLevel: Unit[] = level.getUnitsOfResource(selectedResourceNameNoExt);
        if(unitsFromResourceInLevel.length > 0) {
            unitsInLevelSearchResults.push(new UnitsInLevelSearchResult(level, unitsFromResourceInLevel, selectedResourceNameNoExt));
        }
    }

    return unitsInLevelSearchResults;
}

export function findUnitInLevel() {
    marshallingService.requestRemoteObject('Stingray.LevelEditingService', null, null, {propertyPath: {'EditedLevel': {'ResourceName': '*'}}}).then(_levelEditingService => {

        const resourceName =  _levelEditingService.EditedLevel.ResourceName;
        const levelUri = new AssetUri(resourceName, 'level');

        return getLevel(levelUri).then( (level: Level) => {
            getUnitInLevels("Find a unit in current level", [level]).then( (results: UnitsInLevelSearchResult[]) => {
                for(let result of results) {
                    console.info("Found " + result.units.length + " instances of " + result.unitType + " in " + result.level.levelName);
                }
                console.info("Level search done for : " + _.first(results).selectedResourceName);
            });
        });
    });
}

export function findUnitInAllLevels() {
    getLevels().then(levels => {
        getUnitInLevels("Find a unit in all levels", levels).then( (results: UnitsInLevelSearchResult[]) => {
            for(let result of results) {
                console.info("Found " + result.units.length + " instances of " + result.unitType + " in " + result.level.levelName);
            }
            console.info("Level search done for : " + _.first(results).selectedResourceName);
        });
    });
}

function deleteUnitsFromLevel (searchResult: UnitsInLevelSearchResult) {
    //scatterData
    let unitIds = _.map(searchResult.units, unit => {
        return unit.getId();
    });
    searchResult.level.deleteScatterData(unitIds);
    //scatterData end

    //actual units
    let unitTypeToRemove = searchResult.unitType; //all units have different Ids but the same Type
    searchResult.level.removeUnit(unitTypeToRemove);
};

export function deleteFromCurrentLevel() {
    marshallingService.requestRemoteObject('Stingray.LevelEditingService', null, null, {propertyPath: {'EditedLevel': {'ResourceName': '*'}}}).then(_levelEditingService => {

        const resourceName =  _levelEditingService.EditedLevel.ResourceName;
        const levelUri = new AssetUri(resourceName, 'level');

        return getLevel(levelUri).then( (level: Level) => {
            getUnitInLevels("Choose a unit to delete in current level", [level])
            .then( (results: UnitsInLevelSearchResult[]) => {
                if(_.isEmpty(results)) {
                    return;
                }

                let unitInstanceAmount = 0;
                for(let result of results) {
                    unitInstanceAmount += result.units.length;
                }

                let message = "About to delete " + unitInstanceAmount + " instances of " +'<br>'+ _.first(results).selectedResourceName +'<br>'+ " in current level " + level.levelName + ".  Continue ?";
                let options = {buttons: ['yes', 'no', 'cancel'], style: 'information', height: 258};

                return hostService.openMessageBoxDialog('Level Utils', message, options).then(messageBoxResult => {
                    if (messageBoxResult === 'yes') {
                        for(let result of results) {
                            deleteUnitsFromLevel(result);
                        }

                        saveChangesToLevels([level]).then(() => {
                            console.info("Deleted " + unitInstanceAmount + " instances of " + _.first(results).selectedResourceName + " in current level " + level.levelName + ".");
                        }).then( () => {
                            return reloadCurrentLevel();
                        });
                    }
                });
            });
        });
    });
}

export function deleteFromAllLevels() {
    getLevels().then( levels => {
        getUnitInLevels("Choose a unit to delete in all levels", levels)
        .then( (results: UnitsInLevelSearchResult[]) => {

            if(_.isEmpty(results)) {
                return;
            }

            let levelAmount = results.length;
            let unitInstanceAmount = 0;
            for(let result of results) {
                unitInstanceAmount += result.units.length;
            }

            let message = "About to delete " + unitInstanceAmount + " instances of " +'<br>'+ _.first(results).selectedResourceName +'<br>'+ " in " + levelAmount + " levels. Continue ?";
            let options = {buttons: ['yes', 'no', 'cancel'], style: 'information', height: 258};

            return hostService.openMessageBoxDialog('Level Utils', message, options).then(messageBoxResult => {
                if (messageBoxResult === 'yes') {
                    for(let result of results) {
                        deleteUnitsFromLevel(result); //TODO: improve to put manipulation in class, remove function in function
                    }

                    saveChangesToLevels(_levels).then(() => {
                        console.info("Deleted " + unitInstanceAmount + " instances of " + _.first(results).selectedResourceName + " in " + levelAmount + " levels. ");
                        return reloadCurrentLevel();
                    });
                }
            });
        });
    });
}

function replaceUnit (searchResult: UnitsInLevelSearchResult, replacingUnitSearchResult: UnitsInLevelSearchResult[]) {
    let unitTypeToReplace = searchResult.unitType;
    let unitTypeReplacing = _.first(replacingUnitSearchResult).unitType;

    let editorUnits = searchResult.level.getAllEditorUnitsInLevel();
    for(let editorUnit of editorUnits) {
        if(editorUnit.getType() === unitTypeToReplace) {
            editorUnit.setType(unitTypeReplacing);
        }
    }

    let engineUnits = searchResult.level.getAllEngineUnitsInLevel();
    for(let engineUnit of engineUnits) {
        if(engineUnit.getType() === unitTypeToReplace) {
            engineUnit.setType(unitTypeReplacing);
        }
    }
}

export function replaceUnitInCurrentLevel () {
    let replacedUnitSearchResult: UnitsInLevelSearchResult[] = null;
    let replacingUnitSearchResult: UnitsInLevelSearchResult[] = null;

    marshallingService.requestRemoteObject('Stingray.LevelEditingService', null, null, {propertyPath: {'EditedLevel': {'ResourceName': '*'}}}).then(_levelEditingService => {

        const resourceName =  _levelEditingService.EditedLevel.ResourceName;
        const levelUri = new AssetUri(resourceName, 'level');

        return getLevel(levelUri).then( (level: Level) => {
            getUnitInLevels("Choose a unit to be replaced", [level]).then( (replacedResults: UnitsInLevelSearchResult[]) => {
                return replacedUnitSearchResult = replacedResults;
            }).then( replacedUnitSearchResult => {
                if(_.isEmpty(replacedUnitSearchResult)) {
                    return;
                }
                getUnitInLevels("Choose a unit to replace with", [level]).then( (replacingResults: UnitsInLevelSearchResult[]) => {
                    if(_.isEmpty(replacingResults)) {
                        return;
                    }

                    replacingUnitSearchResult = replacingResults;
                    let unitInstanceAmount = 0;
                    for(let result of replacingResults) {
                        unitInstanceAmount += result.units.length;
                    }

                    let message = "About to replace " + unitInstanceAmount + " instances of " +'<br>'+ _.first(replacedUnitSearchResult).selectedResourceName +'<br>'+ " by the unit " +'<br>'+ _.first(replacingUnitSearchResult).selectedResourceName +'<br>' + " in current level " + level.levelName + ". Continue ?";
                    let options = {buttons: ['yes', 'no', 'cancel'], style: 'information', height: 258};

                    return hostService.openMessageBoxDialog('Level Utils', message, options).then(messageBoxResult => {
                        if (messageBoxResult === 'yes') {

                        for(let result of replacedUnitSearchResult) {
                            replaceUnit(result, replacingUnitSearchResult);
                        }

                        saveChangesToLevels(_.map(replacedUnitSearchResult, (result: UnitsInLevelSearchResult) => {
                            return result.level;
                            })).then(() => {
                                let replacedResourceName: string = _.first(replacedUnitSearchResult).selectedResourceName;
                                let replacingResourceName: string = _.first(replacedUnitSearchResult).selectedResourceName;
                                let message = "Replaced " + unitInstanceAmount + " instances of " +'<br>'+ replacedResourceName +'<br>'+ " by "+'<br>'+ replacingResourceName +'<br>'+ " in current level " + level.levelName + '<br>' + "Immediatly Re-open your current level before doing further changes.";
                                let options = {buttons: ['ok'], style: 'information', height: 258};
                                return hostService.openMessageBoxDialog('Level Utils', message, options, () => {
                                    return reloadCurrentLevel();
                                });
                            });
                        }
                    });
                });
            });
        });
    });
}

export function replaceUnitInProject () {
    let replacedUnitSearchResult: UnitsInLevelSearchResult[] = null;
    let replacingUnitSearchResult: UnitsInLevelSearchResult[] = null;

    getLevels().then( levels => {
        getUnitInLevels("Choose a unit to be replaced", levels).then( (replacedResults: UnitsInLevelSearchResult[]) => {
            return replacedUnitSearchResult = replacedResults;
        }).then( replacedUnitSearchResult => {
            if(_.isEmpty(replacedUnitSearchResult)) {
                return;
            }
            getUnitInLevels("Choose a unit to replace with", levels).then( (replacingResults: UnitsInLevelSearchResult[]) => {
                if(_.isEmpty(replacingResults)) {
                    return;
                }
                replacingUnitSearchResult = replacingResults;
                let levelAmount = replacingResults.length;
                let unitInstanceAmount = 0;
                for(let result of replacingResults) {
                    unitInstanceAmount += result.units.length;
                }

                let message = "About to replace " + unitInstanceAmount + " instances of " +'<br>'+ _.first(replacedUnitSearchResult).selectedResourceName +'<br>'+ " by the unit " +'<br>'+ _.first(replacingUnitSearchResult).selectedResourceName +'<br>' +" in " + levelAmount + " levels. Continue ?";
                let options = {buttons: ['yes', 'no', 'cancel'], style: 'information', height: 258};

                return hostService.openMessageBoxDialog('Level Utils', message, options).then(messageBoxResult => {
                    if (messageBoxResult === 'yes') {

                    for(let result of replacedUnitSearchResult) {
                        replaceUnit(result, replacingUnitSearchResult);
                    }

                    saveChangesToLevels(_.map(replacedUnitSearchResult, (result: UnitsInLevelSearchResult) => {
                        return result.level;
                    })).then(() => {
                        let replacedResourceName: string = _.first(replacedUnitSearchResult).selectedResourceName;
                        let replacingResourceName: string = _.first(replacedUnitSearchResult).selectedResourceName;
                        let message = "Replaced " + unitInstanceAmount + " instances of " +'<br>'+ replacedResourceName +'<br>'+ " by "+'<br>'+ replacingResourceName +'<br>'+ " in " + levelAmount + " levels." + '<br>' + "Immediatly Re-open your current level before doing further changes.";
                        let options = {buttons: ['ok'], style: 'information', height: 258};
                        return hostService.openMessageBoxDialog('Level Utils', message, options, () => {
                            return reloadCurrentLevel();
                        });
                    });
                    }
                });
            });
        });
    })

}

// exported for unit testing purposes
export function getTransformOfUnitById(unitId: any, level: Level): any {
    let editorUnit = level.getEditorUnitInLevel(unitId);

    if(!editorUnit) {
        console.info('Could not find editor unit: ' + unitId);
        return;
    }

    savedEditorTransform = editorUnit.getTransform();

    console.info('Copied transform of object ' + editorUnit.getUnitProperty('Name') + '<br>' +
        'Pivot: ' +  editorUnit.stringifyEditorTransformValues('Pivot') + '<br>' +
        'Position: ' +  editorUnit.stringifyEditorTransformValues('Pos') + '<br>' +
        'Rotation: ' +  editorUnit.stringifyEditorTransformValues('Rot') + '<br>' +
        'Scale: ' +  editorUnit.stringifyEditorTransformValues('Scl'));

    let engineUnit = level.getEngineUnitInLevel(unitId);

    if(!engineUnit){
        console.info('Could not find engine unit: ' + unitId);
        return;
    }

    savedEngineTransform = engineUnit.getTransform();

    return new TransformReturnResult(savedEditorTransform, savedEngineTransform);
}

export function getTransformOfSelection() {
    marshallingService.requestRemoteObject('Stingray.LevelEditingService', null, null, {propertyPath: {'EditedLevel': {'SelectedObjectIds': '*', 'ResourceName': '*'}}}).then((_levelEditingService): any => {

        const selectedObjectIds = _levelEditingService.EditedLevel.SelectedObjectIds;
        const resourceName =  _levelEditingService.EditedLevel.ResourceName;
        const levelUri = new AssetUri(resourceName, 'level');
        if(selectedObjectIds.length === 1) {
        let selectedID = _.first(selectedObjectIds);
        return getLevel(levelUri).then( (level: Level) => {
                getTransformOfUnitById(selectedID,level);
            });
        } else {
            console.info('No unit select to copy transform from');
        }
    });
}

// exported for unit testing purposes
export function copyTransformToUnitsByIds(unitIds: any, level: Level, newEditorTransform:Transform, newEngineTransform:Transform): EditorUnit[] {

    let selectedEditorUnitsTransform:EditorUnit[] = [];
    let selectedEngineUnitsTransform:EngineUnit[] = [];

    for(let selectedObjectId of unitIds) {
        let selectedEditorUnit = level.getEditorUnitInLevel(selectedObjectId);
        selectedEditorUnitsTransform.push(selectedEditorUnit);

        let selectedEngineUnit = level.getEngineUnitInLevel(selectedObjectId);
        selectedEngineUnitsTransform.push(selectedEngineUnit);
    }

    selectedEditorUnitsTransform.forEach(selectedUnit => {
        if(selectedUnit) {
            selectedUnit.setTransform(newEditorTransform.pos, newEditorTransform.rot, newEditorTransform.scale, newEditorTransform.pivot);
        }
    });

    selectedEngineUnitsTransform.forEach(selectedUnit => {
        if(selectedUnit) {
            selectedUnit.setTransform(newEngineTransform.pos, newEngineTransform.rot, newEngineTransform.scale); 
        }
    });

    return selectedEditorUnitsTransform;
}

export function copyTransformToSelection() {

    if(!savedEditorTransform){
        console.info('No copied transforms to copy from');
        return;
    }

    marshallingService.requestRemoteObject('Stingray.LevelEditingService', null, null, {propertyPath: {'EditedLevel': {'SelectedObjectIds': '*', 'ResourceName': '*'}}}).then(levelEditingService => {
        const selectedObjectIds = levelEditingService.EditedLevel.SelectedObjectIds;
        const resourceName =  levelEditingService.EditedLevel.ResourceName;
        const levelUri = new AssetUri(resourceName, 'level');
        if(!_.isEmpty(selectedObjectIds)) {
            getLevel(levelUri).then( (level: Level) => {
                let selectedEditorUnitsTransform = copyTransformToUnitsByIds(selectedObjectIds, level, savedEditorTransform, savedEngineTransform);

                return saveChangesToLevels([level]).then(() => {
                    let pasteMessage = 'Pasted transforms for ';
                    for(let editorUnit of selectedEditorUnitsTransform) {
                        pasteMessage += editorUnit.getName() +'(' + editorUnit.getId() + ')' + '<br>';
                    }
                    return console.info(pasteMessage);
                }).then( () => {
                    return reloadCurrentLevel();
                });
            });
        } else {
            console.info('No unit select to copy transform to');
            return;
        }
    });
}
