#! /usr/bin/env node
const run = require('./lib/run');
const chalk = require('chalk');
const upath = require('upath');
const { fileExists, printMessage } = require('./lib/util');
const {
  DEFAULT_EJS_OPEN,
  DEFAULT_EJS_CLOSE,
  DEFAULT_TEMPLATES_FOLDER,
} = require('./lib/constants');

const { argv } = require('yargs')
  .describe('generator', 'Name of the Github generator. It should be in format `<github-user>/<github-repository>`')
  .describe('template', `Optional: String with a prefix for your templates folder based on the root folder of the generator repository. Default: "${DEFAULT_TEMPLATES_FOLDER}"

  ex: update-yeoman-generator --generator willmendesneto/generate-poi --template-prefix app/templates
  `)
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
  template = DEFAULT_TEMPLATES_FOLDER,
  ejsOpen = DEFAULT_EJS_OPEN,
  ejsClose = DEFAULT_EJS_CLOSE
} = argv;

const yoRcJsonPath = upath.join(process.cwd(), '.yo-rc.json');

if (!fileExists(yoRcJsonPath)) {
  throw new Error(`
  File '.yo-rc.json' is not present in the repository.
  Please make sure your boilerplate creates this file.`);
}

run(generator, template, ejsOpen, ejsClose)
  .then(() => {
    printMessage(`

🎉 ${chalk.green('Success')} 🎉

Next steps:
${chalk.green(' ✔ ')} Run ${chalk.green('npm install')} to update your Node Packages.
${chalk.green(' ✔ ')} Run ${chalk.green('npm test')} to make sure your tests are passing.
${chalk.green(' ✔ ')} Run ${chalk.green('npm start')} to see the chages on the browser.`)
  })
  .catch((err) => printMessage(chalk.red(err)));
