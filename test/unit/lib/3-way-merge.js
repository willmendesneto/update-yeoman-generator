const assert = require('assert');
const fs = require('fs');

const {
  mergeFiles,
  mergeFileIfExists,
} = require('../../../lib/3-way-merge');

const {
  removeFilesInDirectory,
  fileExists,
} = require('../../../lib/util');

describe('3 Way merge', () => {

  const newFilePath = __dirname + '/folder/new-file.txt';
  const fileA = 'My first file';
  const fileOriginal = 'first file';
  const fileB = 'My second file'

  describe('mergeFileIfExists', ()=> {

    afterEach(() => {
      removeFilesInDirectory(newFilePath);
    });

    it('should create file with content if it does not exist', () => {
      assert.equal(fileExists(newFilePath), false);
      mergeFileIfExists(newFilePath, fileOriginal, fileB);
      assert.equal(fileExists(newFilePath), true);
    });

    it('should write the diff between files if it exists', () => {
      assert.equal(fileExists(newFilePath), false);
      mergeFileIfExists(newFilePath, fileOriginal, fileB);
      mergeFileIfExists(newFilePath, fileOriginal, fileB);
      assert.equal(fs.readFileSync(newFilePath, 'utf8'), 'My second file');
    });
  });

  describe('mergeFiles', () => {
    it('should not solve the diff of files `A` and `B` based on the original', () => {
      assert.equal(
        mergeFiles(fileA, fileOriginal, fileB),
        `<<<<<<<<<
My first file
=========
My second file
>>>>>>>>>`
      );
    });

    it('should solve the diff of files `A` and `B` based on the original', () => {
      const fileA = 'My first file';
      const fileOriginal = 'first file';
      const fileB = 'first file'
      assert.equal(mergeFiles(fileA, fileOriginal, fileB), 'My first file');
    });
  });
});
