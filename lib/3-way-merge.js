const { diff3Merge } = require('node-diff3');
const fs = require('fs');
const { writeFileInDirectory } = require('./util');

const BREAK_LINE_CHARACTER = '\n';

const merge = (fileA, originalFile, fileB) => {
  const merged = diff3Merge(fileA, originalFile, fileB, true);

  const fileHasConflict = merged.some((item) => !item.ok);
  const fileDiffResult = merged.reduce((fileContent, item) => {
    if (item.ok) {
      return fileContent.concat(item.ok);
    }

    return fileContent.concat(
      ['<<<<<<<<<'],
      item.conflict.a,
      ['========='],
      item.conflict.b,
      ['>>>>>>>>>']
    );
  }, []);

  return {
    conflict: fileHasConflict,
    result: fileDiffResult,
  };
};

const mergeFiles = (fileA, fileO, fileB) => {
  const mergedFileContent = merge(
    fileA.split(BREAK_LINE_CHARACTER),
    fileO.split(BREAK_LINE_CHARACTER),
    fileB.split(BREAK_LINE_CHARACTER)
  );

  return mergedFileContent.result.join(BREAK_LINE_CHARACTER);
};

const mergeFileIfExists = (path, fileOriginal, fileB) => {
  if (fs.existsSync(path)) {
    const fileA = fs.readFileSync(path, 'utf8');
    const merges = mergeFiles(fileA, fileOriginal, fileB);
    fs.writeFileSync(path, merges, 'utf8');
  } else {
    writeFileInDirectory(path, fileB);
  }
};

module.exports = {
  mergeFiles,
  mergeFileIfExists,
};
