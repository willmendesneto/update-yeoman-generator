const githubDiff = require('github-diff');
const fs = require('fs');
const chalk = require('chalk');
const ejs = require('ejs');
const upath = require('upath');

const { mergeFiles, mergeFileIfExists } = require('./3-way-merge');
const {
  isEjsTemplate,
  writeFileAndCreateDirectories,
  removeFileAndEmptyDir,
  isYeomanTemplate,
  renderBoilerplateFilename,
} = require('./util');

const printFileChangeMessage = (fileStatus, filename) => {
  console.log(`${fileStatus} - ${filename}`);
}

const renderBoilerplatePath = (filename, props, templatePrefix, ejsOpen, ejsClose) => {
  return upath.join(process.cwd(), renderBoilerplateFilename(filename, props, templatePrefix, ejsOpen, ejsClose));
}

module.exports = (
  repository,
  oldGeneratorVersion,
  newGeneratorVersion,
  props,
  templatePrefix,
  patches,
  ejsOpen,
  ejsClose,
) => {
  
  const files = patches.filter(file => isYeomanTemplate(file.filename, templatePrefix));
  const ejsFiles = files.filter(file => isEjsTemplate(file.filename, props, ejsOpen, ejsClose));
  const ejsConflicts = {};

  // Check for naming conflicts with filenames that have ejs templates
  // For example, github would mark a rename from `<%component%>.js` to `0_-component-_0.js
  // as an added and deleted file, even though ejs renders them to the same filename
  ejsFiles.forEach((ejsFile) => {
    const renderedNameA = renderBoilerplatePath(ejsFile.filename, props, templatePrefix, ejsOpen, ejsClose);

    if (renderedNameA in ejsConflicts) {
      // We already found all the copies with this name so don't add it again
      return;
    }

    ejsFiles.forEach((file) => {
      if (ejsFile.filename === file.filename) {
        return;
      }

      const renderedNameB = renderBoilerplatePath(file.filename, props, templatePrefix, ejsOpen, ejsClose);

      if (renderedNameA === renderedNameB) {
        if (ejsConflicts[renderedNameA]) {
          ejsConflicts[renderedNameA].push(file);
        } else {
          ejsConflicts[renderedNameA] = [ejsFile, file];
        }
      }
    });
  });

  Object.keys(ejsConflicts).forEach((key) => {
    // Apply patches specially for ejsConflicts
    const conflictFiles = ejsConflicts[key];

    if (conflictFiles.length !== 2) {
      // We should never end up with more than 2 ejs templates that render to the same name
      // as that implies that they'll render to the same name
      const filenames = [];

      conflictFiles.forEach((file) => {
        filenames.push(`${file.filename} - ${file.status}`);
      });

      // eslint-disable-next-line no-console
      console.log(chalk.red(
        'Unexpected diff. ' +
        `Found more than 2 files with the same ejs rendered filename: ${filenames.join(', ')}`
      ));
      process.exit(1);
    }

    let fileOriginal;
    let fileB;

    // If there are EJS conflicts, then only the following status pairs are possible:
    // removed + added, removed + renamed
    // In both cases, instead of treating them as 2 seperate operations, we want to treat
    // them as a merge instead
    if (conflictFiles[0].status === 'removed') {
      fileOriginal = ejs.render(conflictFiles[0].fileA, props);
      fileB = ejs.render(conflictFiles[1].fileB, props);
    } else {
      fileOriginal = ejs.render(conflictFiles[1].fileA, props);
      fileB = ejs.render(conflictFiles[0].fileB, props);
    }

    const localFile = renderBoilerplatePath(conflictFiles[0].filename, props, templatePrefix, ejsOpen, ejsClose);

    console.log(chalk.yellow(`File modified: ${localFile}`));

    mergeFileIfExists(localFile, fileOriginal, fileB);
  });

  // Run the normal files through a patch system
  files.forEach((patch) => {
    const localFile = renderBoilerplatePath(patch.filename, props, templatePrefix, ejsOpen, ejsClose);

    if (localFile in ejsConflicts) {
      return;
    }

    // Get the file contents and run through ejs
    const fileB = patch.fileB && ejs.render(patch.fileB, props);
    const fileOriginal = patch.fileA && ejs.render(patch.fileA, props);

    // Handle errors and display information
    // Make async
    switch (patch.status) {
      case 'removed':
        console.log(`${chalk.white.bgRed(patch.status)}: ${localFile}`);
        if (fs.existsSync(localFile)) {
          removeFileAndEmptyDir(localFile);
        }
        break;
      case 'added':
        console.log(`${chalk.black.bgGreen(patch.status)}: ${localFile}`);
        // If the file doesn't already exist create a patch (we fake it with a 3 way merge from an empty string)
        mergeFileIfExists(localFile, '', fileB);
        break;
      case 'modified':
        console.log(`${chalk.gray.bgYellow(patch.status)}: ${localFile}`);
        mergeFileIfExists(localFile, fileOriginal, fileB);
        break;
      case 'renamed': {
        console.log(`${chalk.gray.bgCyan(patch.status)}: ${localFile}`);
        const oldFile = renderBoilerplatePath(patch.previousFilename, props, templatePrefix, ejsOpen, ejsClose);
        if (fs.existsSync(localFile)) {
          // If file was renamed, and the new filename already exists, consider it a merge with the new filename
          const fileA = fs.readFileSync(localFile, 'utf8');
          const merge = mergeFiles(fileA, fileOriginal, fileB);
          fs.writeFileSync(localFile, merge, 'utf8');
        } else if (fs.existsSync(oldFile)) {
          // Else if only the old filename exists, merge with the old file and move it to the new filename
          const fileA = fs.readFileSync(oldFile, 'utf8');
          const merge = mergeFiles(fileA, fileOriginal, fileB);
          writeFileAndCreateDirectories(localFile, merge);
          removeFileAndEmptyDir(oldFile);
        } else {
          // Otherwise just create the renamed file
          writeFileAndCreateDirectories(localFile, fileB);
        }
        break;
      }
      default:
        console.log(chalk.red(`Unhandled case: File ${patch.status}: ${localFile}`));
    }
  });
}