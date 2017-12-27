const { exec } = require('child_process');
const { resolve, join } = require('path');
const assert = require('assert');
const { version } = require('../../package.json');

const ROOT_APP = resolve(join(__dirname, './../../'));

describe('Application bootstrap entry point', () => {

  it('should throw an error if `generator` is not set', (done) => {
    exec(`node ${ROOT_APP}/index.js`, (error, stdout, stderr) => {
      assert(stdout === '');
      assert(!!stderr);
      assert(error instanceof Error);
      assert(/Missing required argument: generator/.test(stderr));
      done();
    });
  });

  it('should throw an error if `.yo-rc.json` is not present', (done) => {
    exec(`node ${ROOT_APP}/index.js --generator willmendesneto/generator-poi --ejs-open 0_- --ejs-close -_0`, (error, stdout, stderr) => {
      assert(!!stdout);
      assert(!!stderr);
      assert(/File '.yo-rc.json' is not present in the repository/.test(stderr));
      done();
    });
  });

  it('should return a help message if entrypoint receives `--helper`', (done) => {
    exec(`node ${ROOT_APP}/index.js --helper`, (error, stdout, stderr) => {
      assert(stdout === '');
      assert(/Options:/.test(stderr));
      assert(/--version/.test(stderr));
      assert(/-h, --help/.test(stderr));
      assert(/-g, --generator/.test(stderr));
      assert(/-t, --template/.test(stderr));
      assert(/--ejs-open/.test(stderr));
      assert(/--ejs-close/.test(stderr));
      assert(/Copyright 2017/.test(stderr));
      done();
    });
  });

  it('should return the version value if entrypoint receives `--version`', (done) => {
    exec(`node ${ROOT_APP}/index.js --version`, (error, stdout, stderr) => {
      assert(stdout.indexOf(version) !== -1);
      done();
    });
  });
});