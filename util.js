const ejs = require('ejs');
const fs = require('fs');
const mkdirp = require('mkdirp');
const upath = require('upath');
const { flow, camelCase, upperFirst } = require('lodash');

const pascalcase = flow(camelCase, upperFirst);

const FILE_DELIM_OPEN = '0_-';
const FILE_DELIM_CLOSE = '-_0';

module.exports = {
  isYeomanTemplate: (filename, templatePrefix) => filename.indexOf(templatePrefix) === 0,

  makeProps: ({ name, description, author }, { version }) => {
    const packageName = name.split('/').slice(-1)[0];
    return {
      reactComponent: packageName,
      component: packageName,
      componentCC: pascalcase(packageName),
      generatorVersion: version,
      author: author,
      description: description,
    };
  },

  renderBoilerplateFilename: (filename, props, templatePrefix, ejsDelimiterOpen, ejsDelimiterClose) => {
    // Remove yeoman template path from filename
    let boilerplateFilename = filename.replace(templatePrefix, '')
      // Normalize ejs template strings
      .replace(ejsDelimiterOpen, '<%')
      .replace(ejsDelimiterClose, '%>');

    // render it through ejs
    boilerplateFilename = ejs.render(boilerplateFilename, props);

    // Add dots to gitignore and npmignore
    // Some generators don't solve the files at the first moment
    boilerplateFilename = boilerplateFilename.replace(/(^|\/)gitignore$/, '$1.gitignore');
    boilerplateFilename = boilerplateFilename.replace(/(^|\/)npmignore$/, '$1.npmignore');

    return boilerplateFilename;
  },

  writeFileAndCreateDirectories: (path, file) => {
    // Make sure the directories exist before creating the file
    mkdirp(upath.dirname(path), () => {
      fs.writeFileSync(path, file, 'utf8');
    });
  },

  removeFileAndEmptyDir: (filePath) => {
    fs.unlink(filePath);
    let folder = upath.dirname(filePath);
    while (fs.readdirSync(folder).length === 0) {
      fs.rmdirSync(folder);
      folder = upath.parse(folder).dir;
    }
  },

  isEjsTemplate: (filename, props, ejsDelimiterOpen, ejsDelimiterClose) => {
    const ejsFilename = filename
      .replace(ejsDelimiterOpen, '<%')
      .replace(ejsDelimiterClose, '%>');
    return ejsFilename !== ejs.render(ejsFilename, props);
  }
};
