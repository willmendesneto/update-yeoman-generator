const ejs = require('ejs');
const fs = require('fs');
const mkdirp = require('mkdirp');
const upath = require('upath');
const { flow, camelCase, upperFirst } = require('lodash');
const { DEFAULT_EJS_OPEN, DEFAULT_EJS_CLOSE } = require('./constants');

const normalizeEJSTemplateDelimiters = (filename, ejsDelimiterOpen, ejsDelimiterClose) => filename
  .replace(ejsDelimiterOpen, DEFAULT_EJS_OPEN)
  .replace(ejsDelimiterClose, DEFAULT_EJS_CLOSE);

const toPascalCase = flow(camelCase, upperFirst);
const getPackageNameWithoutOrganization = (name) => name.split('/').slice(-1)[0];

module.exports = {
  // eslint-disable-next-line no-console
  printMessage: (message) => console.log(message),

  isAYeomanTemplate: (filename, templatePrefix) => filename.indexOf(templatePrefix) === 0,

  formatProps: ({ name, description, author }, { version }) => {
    const packageName = getPackageNameWithoutOrganization(name);

    return {
      reactComponent: packageName,
      component: packageName,
      componentCC: toPascalCase(packageName),
      generatorVersion: version,
      author,
      description
    };
  },

  renderBoilerplateFilename: (filename, props, templatePrefix, ejsDelimiterOpen, ejsDelimiterClose) => {
    let normalizedBoilerplateFilename = normalizeEJSTemplateDelimiters(
      filename.replace(templatePrefix, ''),
      ejsDelimiterOpen,
      ejsDelimiterClose
    );

    normalizedBoilerplateFilename = ejs.render(normalizedBoilerplateFilename, props);


    //  Add dots to gitignore and npmignore
    //  Some generators don't solve the files at the first moment
    normalizedBoilerplateFilename = normalizedBoilerplateFilename.replace(/(^|\/)gitignore$/, '$1.gitignore');
    normalizedBoilerplateFilename = normalizedBoilerplateFilename.replace(/(^|\/)npmignore$/, '$1.npmignore');

    return normalizedBoilerplateFilename;
  },

  writeFileInDirectory: (directory, file) => {
    mkdirp.sync(upath.dirname(directory));
    fs.writeFileSync(directory, file, 'utf8');
  },

  removeFilesInDirectory: (filePath) => {
    fs.unlinkSync(filePath);
    let folder = upath.dirname(filePath);
    while (fs.readdirSync(folder).length === 0) {
      fs.rmdirSync(folder);
      folder = upath.parse(folder).dir;
    }
  },

  isAnEJSTemplate: (filename, props, ejsDelimiterOpen, ejsDelimiterClose) => {
    const ejsFilename = normalizeEJSTemplateDelimiters(
      filename,
      ejsDelimiterOpen,
      ejsDelimiterClose
    );

    return ejsFilename !== ejs.render(ejsFilename, props);
  },

  fileExists: (filePath) => {
    let fileExists = false;

    try {
      fileExists = fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      fileExists = false;
    }

    return !!fileExists;
  }
};
