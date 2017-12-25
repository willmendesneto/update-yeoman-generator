const assert = require('assert');

const {
  isYeomanTemplate,
  makeProps,
  renderBoilerplateFilename,
  isEjsTemplate,
} = require('../util');

const FILE_DELIM_OPEN = '0_-';
const FILE_DELIM_CLOSE = '-_0';

describe('Utility functions', () => {
    describe('isYeomanTemplate', () => {
        it('should return `true` if file location contains template folder location', () => {
            assert(isYeomanTemplate('app/templates/index.js', 'app/templates'));
            assert(isYeomanTemplate('app/templates/README.md', 'app/templates'));
        });

        it('should return `false` if file location does not not contains template folder location', () => {
            assert.equal(isYeomanTemplate('app/templates/index.js', 'app/_templates'), false);
            assert.equal(isYeomanTemplate('app/templates/README.md', 'app/_templates'), false);
        });
    });

    describe('makeProps', () => {

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
                makeProps(packageJson, yoRcJson),
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
            props = makeProps(packageJson, yoRcJson);
        });

        it('should creates the filename based on props information', () => {
            const filename = 'app/templates/0_-=component-_0.js';
            const templatePrefix = 'app/templates/';
            assert.equal(renderBoilerplateFilename(filename, props, templatePrefix, FILE_DELIM_OPEN, FILE_DELIM_CLOSE), 'package-name.js');
             
        });
    });

    describe('isEjsTemplate', () => {
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
            props = makeProps(packageJson, yoRcJson);
        });

        it('should return `true` if filename contains EJS delimiters and prop key name', () => {
            assert(isEjsTemplate('0_-=component-_0.js', props, FILE_DELIM_OPEN, FILE_DELIM_CLOSE));
        });

        it('should return `false` if filename does not contains EJS delimiters', () => {
            assert.equal(isEjsTemplate('app/templates/README.md', props, FILE_DELIM_OPEN, FILE_DELIM_CLOSE), false);
        });
    });
});