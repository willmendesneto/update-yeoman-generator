#! /usr/bin/env node
const githubDiff = require('github-diff');
const fs = require('fs');
const upath = require('upath');
const chalk = require('chalk');
const get = require('lodash/get');
const fetch = require('node-fetch');

const checkDiffPatches = require('./check-diff-patches');
const { makeProps, renderBoilerplateFilename } = require('./util');

const getPackageJsonData = (generator, token) => {
  const urlComplement = token ? `?token=${token}` : '';
  return fetch(`https://raw.githubusercontent.com/${generator}/master/package.json${urlComplement}`, { method: 'GET' })
    .then(response => response.json())
    .catch(error => error);
}

const transformContentToJson = (filename) => JSON.parse(fs.readFileSync(filename, 'utf8'));

const printFileChangeMessage = (fileStatus, filename) => {
  console.log(chalk.blue(`${fileStatus} - ${filename}`));
}

module.exports = (generator, templatePrefix, ejsOpen, ejsClose) => {

  let oldGeneratorVersion;
  let newGeneratorVersion;
  let props;

  const [ githubUser, githubRepository ] = generator.split('/');

  const updateGeneratorVersion = (generatorPackageJson) => {

    const projectPackageJsonPath = upath.join(process.cwd(), 'package.json');
    const yoRcJsonPath = upath.join(process.cwd(), '.yo-rc.json');
    
    const projectPackageJson = transformContentToJson(projectPackageJsonPath, 'utf8');
    const yoRcJson = get(transformContentToJson(yoRcJsonPath, 'utf8'), githubRepository, null);
  
    oldGeneratorVersion = yoRcJson.version;
    newGeneratorVersion = generatorPackageJson.version;
    
    if (oldGeneratorVersion === newGeneratorVersion) {
      throw new Error(`Generator ${generator} is up-to-date.`)
    }

    console.log(chalk.green(`Updating generator ${generator} from: v${oldGeneratorVersion} to v${newGeneratorVersion}`));
  
    props = makeProps(projectPackageJson, yoRcJson);
  
    const newPackageJson = {
      [githubRepository]: Object.assign({}, yoRcJson, { version: newGeneratorVersion}),
    };
  
    fs.writeFileSync(yoRcJsonPath, JSON.stringify(newPackageJson, null, 2), 'utf8');
  }
  
  const token = process.env.GITHUB_DIFF_TOKEN;

  return getPackageJsonData(generator, token)
    // Update the version field in your `.yo-rc.json`. If .yo-rc.json hasn't changed between generator versions this must be done manually
    .then(generatorPackageJson => updateGeneratorVersion(generatorPackageJson))
    .then(() => githubDiff(
      generator,
      `v${oldGeneratorVersion}`,
      `v${newGeneratorVersion}`,
    ))
    .then((patches) => checkDiffPatches(
      generator,
      `v${oldGeneratorVersion}`,
      `v${newGeneratorVersion}`,
      props,
      templatePrefix,
      patches,
      ejsOpen,
      ejsClose,
    ))
    .then(() => console.log(chalk.green(`\n✔ Yeoman generator ${githubRepository} updated to v${newGeneratorVersion}`)))
    .catch((err) => {
      console.log(
        chalk.red(
          `\nAn error occurred when tried to updated ${githubRepository} yeoman generator from 'v${oldGeneratorVersion}' to 'v${newGeneratorVersion}'`,
          err
      ));
    });

}