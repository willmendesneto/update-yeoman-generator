const diff3 = require('node-diff3');
const fs = require('fs');
const { writeFileAndCreateDirectories } = require('./util');

const BREAK_LINE_CHARACTER = '\n';

// Clone of merge function from diff3 but changes the conflict line styles
const merge = (fileA, originalFile, fileB) => {
  let merger = diff3.diff3Merge(fileA, originalFile, fileB, true);
  let conflict = false;
  let result = [];
  let mergerLength = merger.length;
  for (let i = 0; i < mergerLength; i++) {
    let item = merger[i];
    if (item.ok) {
      result = result.concat(item.ok);
    } else {
      conflict = true;
      result = result.concat(
        ['<<<<<<<<<'],
        item.conflict.a,
        ['========='],
        item.conflict.b,
        ['>>>>>>>>>']
      );
    }
  }
  return { conflict, result };
}
/* eslint-enable */

const mergeFiles = (fileA, fileO, fileB) => {
  return merge(
    fileA.split(BREAK_LINE_CHARACTER),
    fileO.split(BREAK_LINE_CHARACTER),
    fileB.split(BREAK_LINE_CHARACTER),
  ).result.join(BREAK_LINE_CHARACTER);
}

const mergeFileIfExists = (path, fileOriginal, fileB) => {
  if (fs.existsSync(path)) {
    const fileA = fs.readFileSync(path, 'utf8');
    const merges = mergeFiles(fileA, fileOriginal, fileB);
    fs.writeFileSync(path, merges, 'utf8');
  } else {
    writeFileAndCreateDirectories(path, fileB);
  }
}

module.exports = {
  mergeFiles,
  mergeFileIfExists,
};
