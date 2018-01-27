# update-yeoman-generator

[![Greenkeeper badge](https://badges.greenkeeper.io/willmendesneto/update-yeoman-generator.svg)](https://greenkeeper.io/)

> Update your Yeoman generator with style

[![MIT License][license-badge]][license]
[![PRs Welcome][prs-badge]][prs]
[![Watch on GitHub][github-watch-badge]][github-watch]
[![Star on GitHub][github-star-badge]][github-star]
[![Tweet][twitter-badge]][twitter]


A script to help update repositories using Yeoman generators to the latest version.

## Requirements

To use this package the generator should:

- Creates a `.yo-rc.json` storing the version of your application. It should follow the Yeoman storage specs.

```json
// .yo-rc.json
{
  "generator-poi": {
    "version": "1.0.0"
  }
}
```


## Setup

### Private repositories

In order to use update-yeoman-generator in private repositories you'll need to
[create a personal access token](https://github.com/settings/tokens)
which has permissions to read private repositories:

![Token permissions](./assets/token.png)

Then, set the environment variable `GITHUB_DIFF_TOKEN` to the token you've just created

You can run the following in the command line or add it your `.bashrc`, `.zshrc` or in your command line integration file

```bash
export GITHUB_DIFF_TOKEN=<token>
```

### Run update-yeoman-generator

Make sure you have `npm@>=5.2.0`:

```
npm install -g npm@latest
```

### Parameters
-  `-g`, `--generator`      [required]                              Name of the Github generator. It should be in format                     
                            `update-yeoman-generator --generator <github-user>/<github-repository>`   
-  `--version`              [optional]                              Show package version number
-  `--ejs-open`             [optional] [default: "<%"]              `.ejs` File delimiter for open tag
-  `--ejs-close`            [optional] [default: "%>"]              `.ejs` File delimiter for close tag.
-  `-t`, `--template`       [optional] [default: "app/templates"]   String with a prefix for your templates
                            folder based on the root folder of the generator repository.
-  `-h`, `--help`           [optional]                              Show help command

Inside the existing boilerplate generated repository run:

```
update-yeoman-generator
```

`update-yeoman-generator` will apply the changes from the latest version of boilerplate as a git style merge - so you'll still need to manually fix conflicts.

## Usage

```bash
$ npm install -g update-yeoman-generator
$ cd <your-project-generated-using-yeoman-generator>
$ update-yeoman-generator --help
Options:
  --version        Show version number                                 [boolean]
  --ejs-open                                                     [default: "<%"]
  --ejs-close                                                    [default: "%>"]
  -h, --help       Show help                                           [boolean]
  -g, --generator  Name of the Github generator. It should be in format
                   `<github-user>/<github-repository>`                [required]
  -t, --template                             [string] [default: "app/templates"]



Copyright 2017

$ update-yeoman-generator --generator <github-user>/<github-repository>
```


## Author

**Wilson Mendes (willmendesneto)**
+ <https://plus.google.com/+WilsonMendes>
+ <https://twitter.com/willmendesneto>
+ <http://github.com/willmendesneto>


[license-badge]: https://img.shields.io/badge/license-MIT%20License-blue.svg?style=flat-square
[license]: https://github.com/willmendesneto/nodebots-workshop/blob/master/LICENSE

[prs-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[prs]: http://makeapullrequest.com

[github-watch-badge]: https://img.shields.io/github/watchers/willmendesneto/update-yeoman-generator.svg?style=social
[github-watch]: https://github.com/willmendesneto/update-yeoman-generator/watchers

[github-star-badge]: https://img.shields.io/github/stars/willmendesneto/update-yeoman-generator.svg?style=social
[github-star]: https://github.com/willmendesneto/update-yeoman-generator/stargazers

[twitter]: https://twitter.com/intent/tweet?text=Check%20out%20update-yeoman-generator%20by%20@willmendesneto%20https://goo.gl/sqZ8dh%20%F0%9F%91%8D
[twitter-badge]: https://img.shields.io/twitter/url/https/github.com/willmendesneto/update-yeoman-generator.svg?style=social