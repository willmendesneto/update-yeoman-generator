#! /usr/bin/env node
const run = require('./lib/run');
const chalk = require('chalk');
const upath = require('upath');
const { fileExists, printMessage } = require('./lib/util');
const { DEFAULT_EJS_OPEN, DEFAULT_EJS_CLOSE, DEFAULT_TEMPLATES_FOLDER, DEFAULT_JSON_STORAGE_FILE } = require('./lib/constants');

const { argv } = require('yargs')
  .describe('generator', 'Name of the Github generator. It should be in format `<github-user>/<github-repository>`')
  .describe(
    'template',
    `Optional: String with a prefix for your templates folder based on the root folder of the generator repository. Default: "${DEFAULT_TEMPLATES_FOLDER}"

EX:

    update-yeoman-generator --generator willmendesneto/generate-poi --template-prefix app/templates

    update-yeoman-generator --generator <github-user>/<github-repository> --github-token <your-github-token> --template-prefix app/templates
  `
  )
  .describe(
    'json-storage-file',
    `Optional: JSON file based on the root folder of the generator repository with the storage data. Default: "${DEFAULT_JSON_STORAGE_FILE}"`
  )
  .describe('github-token', 'Optional: Github Token required for private repositories.')
  .describe('ejs-open', `Optional: '.ejs' File delimiter for open tag. Default: "${DEFAULT_TEMPLATES_FOLDER}"`)
  .describe('ejs-close', `Optional: '.ejs' File delimiter for close tag. Default: "${DEFAULT_TEMPLATES_FOLDER}"`)
  .string('template')
  .check(({ generator }) => generator.split('/').length === 2)
  .demandOption(['generator'])
  .help('h')
  .alias('g', 'generator')
  .alias('t', 'template')
  .alias('h', 'help')
  .epilog('\n\nCopyright 2017');

printMessage(chalk.inverse(' INFO ') + ' Starting `update-yeoman-generator` script');

const {
  generator,
  githubToken,
  jsonFile = DEFAULT_JSON_STORAGE_FILE,
  template = DEFAULT_TEMPLATES_FOLDER,
  ejsOpen = DEFAULT_EJS_OPEN,
  ejsClose = DEFAULT_EJS_CLOSE,
} = argv;

const yoRcJsonPath = upath.join(process.cwd(), jsonFile);

if (!fileExists(yoRcJsonPath)) {
  throw new Error(`
  File '.yo-rc.json' is not present in the repository.
  Please make sure your boilerplate creates this file.`);
}

const runApp = async () => {

  try {
    await run(generator, template, ejsOpen, ejsClose, githubToken);
    printMessage(`

🎉 ${chalk.green('Success')} 🎉

Next steps:
  ${chalk.green(' ✔ ')} Run ${chalk.green('npm install')} to update your Node Packages.
  ${chalk.green(' ✔ ')} Run ${chalk.green('npm test')} to make sure your tests are passing.
  ${chalk.green(' ✔ ')} Run ${chalk.green('npm start')} to see the chages on the browser.
  `);

  } catch (error) {
    printMessage(chalk.red(error));
  }
};

runApp();
