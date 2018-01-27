const { exec } = require('child_process');
const { resolve, join } = require('path');
const assert = require('assert');

const ROOT_APP = resolve(join(__dirname, './../../'));
const BOILERPLATE_TEST_APP = resolve(join(__dirname, './fixtures'));

describe('Application bootstrap entry point', () => {
  let STDOUT;
  let STDERROR;
  before((done) => {
    exec(`node ${ROOT_APP}/index.js --generator willmendesneto/generator-update-yeoman-test --ejs-open 0_- --ejs-close -_0`, { cwd: BOILERPLATE_TEST_APP }, (error, stdout, stderr) => {
      STDOUT = stdout;
      STDERROR = stderr;
      console.log(STDOUT);

      done();
    });
  });

  after((done) => {
    exec('git checkout .', { cwd: BOILERPLATE_TEST_APP }, () => {
      done();
    });
  });

  it('should print the boilerplate information', () => {
    assert(/Updating generator/.test(STDOUT));
    assert(/from: v0.0.3 to v0.0.5/.test(STDOUT));
    assert(/Yeoman generator generator-update-yeoman-test updated to v0.0.5/.test(STDOUT));
    assert(/Success/.test(STDOUT));
    assert(!!STDOUT);
  });

  it('should NOT return an error', () => {
    assert(!STDERROR);
  });

  it('should show the modified files', () => {
    assert(/test\/integration\/fixtures\/index.js/.test(STDOUT));
    assert(/MODIFIED/.test(STDOUT));
  });

  it('should show the removed files', () => {
    assert(/test\/integration\/fixtures\/.editorconfig/.test(STDOUT));
    assert(/REMOVED/.test(STDOUT));
  });

  it('should show the added files', () => {
    assert(/test\/integration\/fixtures\/new-file.js/.test(STDOUT));
    assert(/ADDED/.test(STDOUT));
  });
});
