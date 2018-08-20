const fs = require('fs');
const chalk = require('chalk');
const ejs = require('ejs');
const upath = require('upath');

const { mergeFiles, mergeFileIfExists } = require('./3-way-merge');
const {
  isAnEJSTemplate,
  writeFileInDirectory,
  removeFilesInDirectory,
  isAYeomanTemplate,
  renderBoilerplateFilename,
  printMessage,
} = require('./util');
const {
  CONFLICT_STATUS_REMOVED,
  CONFLICT_STATUS_ADDED,
  CONFLICT_STATUS_MODIFIED,
  CONFLICT_STATUS_RENAMED,
} = require('./constants');

const renderBoilerplatePath = (filename, props, templatePrefix, ejsOpen, ejsClose) => {
  const boilerplateFileName = renderBoilerplateFilename(filename, props, templatePrefix, ejsOpen, ejsClose);

  return upath.join(process.cwd(), boilerplateFileName);
};

const MAXIMUM_NUMBER_ALLOWED_FILES_WITH_PATCHES = 2;

// eslint-disable-next-line max-params
module.exports = (
  repository,
  oldGeneratorVersion,
  newGeneratorVersion,
  props,
  templatePrefix,
  patches,
  ejsOpen,
  ejsClose
) => {

  const files = patches.filter((file) => isAYeomanTemplate(file.filename, templatePrefix));
  const ejsFiles = files.filter((file) => isAnEJSTemplate(file.filename, props, ejsOpen, ejsClose));
  const ejsConflicts = {};

  // eslint-disable-next-line max-statements
  const filePatchHandler = (patch, fileOriginal, fileB, localFile) => {
    const patchStatusUppercase = ` ${patch.status.toUpperCase()} `;
    const localFileConsoleMessage = chalk.gray(localFile);

    switch (patch.status) {
      case CONFLICT_STATUS_REMOVED:
        printMessage(`${chalk.black.bgRed(patchStatusUppercase)}: ${localFileConsoleMessage}`);
        if (fs.existsSync(localFile)) {
          removeFilesInDirectory(localFile);
        }
        break;
      case CONFLICT_STATUS_ADDED:
        printMessage(`${chalk.black.bgGreen(patchStatusUppercase)}: ${localFileConsoleMessage}`);
        // If the file doesn't already exist create a patch (we fake it with a 3 way merge from an empty string)
        mergeFileIfExists(localFile, '', fileB);
        break;
      case CONFLICT_STATUS_MODIFIED:
        printMessage(`${chalk.black.bgYellow(patchStatusUppercase)}: ${localFileConsoleMessage}`);
        mergeFileIfExists(localFile, fileOriginal, fileB);
        break;
      case CONFLICT_STATUS_RENAMED: {
        printMessage(`${chalk.inverse(patchStatusUppercase)}: ${localFileConsoleMessage}`);
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
          writeFileInDirectory(localFile, merge);
          removeFilesInDirectory(oldFile);
        } else {
          // Otherwise just create the renamed file
          writeFileInDirectory(localFile, fileB);
        }
        break;
      }
      default:
        printMessage(`${chalk.black.bgRed(' UNHANDLED ')}: ` +
        `File ${chalk.inverse(patchStatusUppercase)}: ${localFileConsoleMessage}`);
    }
  };

  //  If there are EJS conflicts, then only the following status pairs are possible:
  //  removed + added, removed + renamed
  //  In both cases, instead of treating them as 2 seperate operations, we want to treat
  //  Them as a merge instead
  // eslint-disable-next-line max-statements
  const applyingFileChanges = ([firstFileContent, secondFileContent]) => {

    let fileOriginal;
    let fileB;

    const firstFileWasRemoved = firstFileContent.status === CONFLICT_STATUS_REMOVED;

    if (firstFileWasRemoved) {
      fileOriginal = ejs.render(firstFileContent.fileA, props);
      fileB = ejs.render(secondFileContent.fileB, props);
    } else {
      fileOriginal = ejs.render(secondFileContent.fileA, props);
      fileB = ejs.render(firstFileContent.fileB, props);
    }

    const localFile = renderBoilerplatePath(firstFileContent.filename, props, templatePrefix, ejsOpen, ejsClose);

    printMessage(`${chalk.yellow('File modified')}: ${chalk.gray(localFile)}`);

    mergeFileIfExists(localFile, fileOriginal, fileB);
  };

  //  Check for naming conflicts with filenames that have ejs templates
  //  For example, github would mark a rename from `<%component%>.js` to `0_-component-_0.js
  //  As an added and deleted file, even though ejs renders them to the same filename
  ejsFiles.forEach((ejsFile) => {
    const renderedNameA = renderBoilerplatePath(ejsFile.filename, props, templatePrefix, ejsOpen, ejsClose);

    const isADuplicatedConflict = renderedNameA in ejsConflicts;
    if (isADuplicatedConflict) {
      return;
    }

    ejsFiles.forEach((file) => {
      if (ejsFile.filename === file.filename) {
        return;
      }

      const renderedNameB = renderBoilerplatePath(
        file.filename,
        props,
        templatePrefix,
        ejsOpen,
        ejsClose
      );

      if (renderedNameA === renderedNameB && ejsConflicts[renderedNameA]) {
        ejsConflicts[renderedNameA].push(file);
      } else {
        ejsConflicts[renderedNameA] = [
          ejsFile,
          file
        ];
      }
    });
  });

  Object.keys(ejsConflicts).forEach((key) => {
    const esjConflictFilesWithPatchesChanges = ejsConflicts[key];
    // We should never end up with more than 2 ejs templates that render to the same name
    // As that implies that they'll render to the same name
    if (esjConflictFilesWithPatchesChanges.length !== MAXIMUM_NUMBER_ALLOWED_FILES_WITH_PATCHES) {
      const filenames = esjConflictFilesWithPatchesChanges.map((file) => `${file.filename} - ${file.status}`);

      throw new Error('Unexpected diff. ' +
        `Found more than 2 files with the same ejs rendered filename: ${filenames.join(', ')}`);
    }

    applyingFileChanges(esjConflictFilesWithPatchesChanges);

  });

  // Run the normal files through a patch system
  // eslint-disable-next-line max-params
  files.forEach((patch) => {
    const localFile = renderBoilerplatePath(
      patch.filename,
      props,
      templatePrefix,
      ejsOpen,
      ejsClose
    );

    if (localFile in ejsConflicts) {
      return;
    }

    // Get the file contents and run through ejs
    const fileB = patch.fileB && ejs.render(patch.fileB, props);
    const fileOriginal = patch.fileA && ejs.render(patch.fileA, props);

    // Handle errors and display information
    filePatchHandler(patch, fileOriginal, fileB, localFile);

  });
};
