/* jshint jasmine: true */
/* globals it, describe, expect*/
describe('Level utils plugin', function(require) {
    'use strict';

//this require is required to instanciate the file system store and create the protocol
require('foundation/file-system-store');

const dataService = require('services/data-service');
const LevelUtils = require('../level-utils-action');

const _levelSelector = '**/*.level';
const _testUnitName = 'content/models/props/ChamfBox';
const _testGetTransformUnitId = 'ffd94a57-fe64-4025-abe1-eda1d4904d8e';
const _testCopyTransformUnitId = 'e103a398-62f2-48bf-be43-80fb82048d9d';
const _testPasteTransformUnitId = '8c9eab58-640f-45c8-9bd7-98ee8950a738';

function getDb (testPath = '') {
    let testSpecPath = require.toUrl('.');
    let testDbUrl = `file:///${testSpecPath}test_db` + testPath;
    return dataService.mount(testDbUrl);
}

function compareTransformProperties( ...arrays) {
    if(!arrays || arrays.length < 2)
        return;

    let firstArray = _.first(arrays);
    let arraysLength = firstArray.length;
    let arraysIdentical = true;

    if(!_.every(arrays, array => {
        return array.length === arraysLength;
    })) {
        return false;
    }

    for(let i = 0; i < firstArray.length; ++i) {
        for(let j = 0; j < arrays.length -1; ++j) {
            if(Math.abs(arrays[j][i] - arrays[j+1][i]) > 0.0001)
                arraysIdentical = false;
        }
    }

    return arraysIdentical;
}

it('should be defined', () => {
    expect(_.isFunction(LevelUtils.getUnitsInLevelsByName)).toBeTruthy();
});

it('should mount test db', done => {
    let db = getDb();
    db.get(`**/*.level`).then(entries => {
        expect(entries).toBeDefined();
    }).then(done).catch(done.fail);
});

it('should get and create Levels', done => {
    let db = getDb();
    LevelUtils.getLevelsForTests(_levelSelector, db).then( levels => {

        for(let level of levels) {
            expect(level.getLevelInfo()).toBeDefined();
            expect(level.getLevelData()).toBeDefined();
            expect(level.getAllEditorUnitsInLevel().length).toEqual( level.getAllEngineUnitsInLevel().length);
        }
    }).then(done).catch(done.fail);
});

it('should find the correct amount of a given unit', done => {
    let db = getDb();
    LevelUtils.getLevelsForTests(_levelSelector, db).then( levels => {

        let results = LevelUtils.getUnitsInLevelsByName(_testUnitName,levels);

        expect(results[0].units.length).toEqual(1);
        expect(results[1].units.length).toEqual(3);

        for(let result of results) {
            let everyResult = _.every(result.units, unit => {
                return unit.type === result.unitType;
            });

            expect(everyResult).toBeTruthy();
        }

    }).then(done).catch(done.fail);
});

it('should find the correct transform of a given unit', done => {
    let db = getDb();
    LevelUtils.getLevelsForTests(_levelSelector, db).then( levels => {

        let transformResult = LevelUtils.getTransformOfUnitById(_testGetTransformUnitId, levels[0]);
        let transform = transformResult.engineTransform;

        expect(compareTransformProperties(transform.pos, [0, 0, 18])).toBeTruthy();
        expect(compareTransformProperties(transform.rot, [0.639398, -0.066221, -0.055925, -0.763975])).toBeTruthy();
        expect(compareTransformProperties(transform.scale, [1, 1, 1])).toBeTruthy();

    }).then(done).catch(done.fail);
});

it('should correctly copy and paste the transform of a given unit', done => {
    let db = getDb();
    LevelUtils.getLevelsForTests(_levelSelector, db).then( levels => {

        let transform = LevelUtils.getTransformOfUnitById(_testGetTransformUnitId, levels[0]);

        let copiedTransform = LevelUtils.getTransformOfUnitById(_testCopyTransformUnitId, levels[1]);
        let editorUnitsPastedTransforms = LevelUtils.copyTransformToUnitsByIds([_testPasteTransformUnitId], levels[1], copiedTransform.editorTransform, copiedTransform.engineTransform);
        let editorUnitPastedTransform = _.first(editorUnitsPastedTransforms).transform;

        expect(compareTransformProperties(editorUnitPastedTransform.pos, copiedTransform.editorTransform)).toBeTruthy();
        expect(compareTransformProperties(editorUnitPastedTransform.rot, copiedTransform.editorTransform)).toBeTruthy();
        expect(compareTransformProperties(editorUnitPastedTransform.scale, copiedTransform.editorTransform)).toBeTruthy();

    }).then(done).catch(done.fail);
});

});
