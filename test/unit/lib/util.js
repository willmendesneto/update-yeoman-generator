const assert = require('assert');
const fs = require('fs');

const {
  isAYeomanTemplate,
  formatProps,
  renderBoilerplateFilename,
  isAnEJSTemplate,
  writeFileInDirectory,
  removeFilesInDirectory,
  fileExists,
} = require('../../../lib/util');

const FILE_DELIM_OPEN = '0_-';
const FILE_DELIM_CLOSE = '-_0';

describe('Utility functions', () => {
  describe('fileExists', () => {
    it('should return `true` if file exists', () => {
      assert.equal(fileExists(__dirname + '/3-way-merge.js'), true);
    });

    it('should return `false` if file does not exist', () => {
      assert.equal(fileExists(__dirname + '/this-file-does-not-exist.js'), false);
    });
  });

  describe('isAYeomanTemplate', () => {
    it('should return `true` if file location contains template folder location', () => {
      assert(isAYeomanTemplate('app/templates/index.js', 'app/templates'));
      assert(isAYeomanTemplate('app/templates/README.md', 'app/templates'));
    });

    it('should return `false` if file location does not not contains template folder location', () => {
      assert.equal(isAYeomanTemplate('app/templates/index.js', 'app/_templates'), false);
      assert.equal(isAYeomanTemplate('app/templates/README.md', 'app/_templates'), false);
    });
  });

  describe('formatProps', () => {

    it('should return the mapped generator information properties', () => {
      const packageJson = {
        name: 'package-name',
        author: 'author name',
        description: 'package description'
      };
      const yoRcJson = {
        version: '1.1.1',
      }
      assert.deepEqual(
        formatProps(packageJson, yoRcJson),
        {
          reactComponent: packageJson.name,
          component: packageJson.name,
          componentCC: 'PackageName',
          generatorVersion: yoRcJson.version,
          author: packageJson.author,
          description: packageJson.description,
        }
      );
    });
  });

  describe('renderBoilerplateFilename', () => {
    let props;
    beforeEach(() => {
      const packageJson = {
        name: 'package-name',
        author: 'author name',
        description: 'package description'
      };
      const yoRcJson = {
        version: '1.1.1',
      }
      props = formatProps(packageJson, yoRcJson);
    });

    it('should creates the filename based on props information', () => {
      const filename = 'app/templates/0_-=component-_0.js';
      const templatePrefix = 'app/templates/';
      assert.equal(renderBoilerplateFilename(filename, props, templatePrefix, FILE_DELIM_OPEN, FILE_DELIM_CLOSE), 'package-name.js');

    });
  });

  describe('isAnEJSTemplate', () => {
    let props;
    beforeEach(() => {
      const packageJson = {
        name: 'package-name',
        author: 'author name',
        description: 'package description'
      };
      const yoRcJson = {
        version: '1.1.1',
      }
      props = formatProps(packageJson, yoRcJson);
    });

    it('should return `true` if filename contains EJS delimiters and prop key name', () => {
      assert(isAnEJSTemplate('0_-=component-_0.js', props, FILE_DELIM_OPEN, FILE_DELIM_CLOSE));
    });

    it('should return `false` if filename does not contains EJS delimiters', () => {
      assert.equal(isAnEJSTemplate('app/templates/README.md', props, FILE_DELIM_OPEN, FILE_DELIM_CLOSE), false);
    });
  });

  describe('writting and removing content', () => {
    const filePath = __dirname + '/folder/file.txt';
    const fileContent = 'My file content';

    it('should create file with content', () => {
      writeFileInDirectory(filePath, fileContent);
      assert.equal(fs.readFileSync(filePath, 'utf8'), fileContent);
    });

    it('should remove file and folder', () => {
      writeFileInDirectory(filePath, fileContent);
      removeFilesInDirectory(filePath);
      let fileExists = false;
      try {
        fileExists = fs.readFileSync(filePath, 'utf8');
      } catch (error) {
        fileExists = false;
      }
      assert.equal(fileExists, false);
    });
  });
});
