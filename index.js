#! /usr/bin/env node
const run = require('./run');
const chalk = require('chalk');

const { argv } = require('yargs')
  .describe('generator', 'Name of the Github generator. It should be in format `<github-user>/<github-repository>`')
  .describe('template', `Optional: String with a prefix for your templates folder based on the root folder of the generator repository.
  
  ex: update-yeoman-generator --generator willmendesneto/generate-poi --template-prefix app/templates
  `)
  .describe('ejs-open', 'Optional: `.ejs` File delimiter for open tag.')
  .describe('ejs-close', 'Optional: `.ejs` File delimiter for close tag.')
  .string('template')
  .option('template', { default: 'app/templates' })
  .option('ejs-open', { default: '<%' })
  .option('ejs-close', { default: '%>' })
  .check(({ generator }) => generator.split('/').length === 2)
  .demandOption(['generator'])
  .help('h')
  .alias('g', 'generator')
  .alias('t', 'template')
  .alias('h', 'help')
  .epilog('\n\nCopyright 2017');

console.log(chalk.blue('... Starting `update-yeoman-generator` script'));

const { generator, template, ejsOpen, ejsClose } = argv;

run(generator, template, ejsOpen, ejsClose)
  .then(() => {
    console.log(chalk.green(`

🎉 Success 🎉

Next steps:
- run 'npm install' to update your Node Packages.
- run 'npm test' to make sure your tests are passing.
- run 'npm start' to see the chages on the browser.`))
  })
  .catch((err) => console.log(chalk.red(err)));