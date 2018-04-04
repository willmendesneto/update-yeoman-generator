const GithubApi = require('@octokit/rest');
const isBinary = require('is-binary-buffer');

const atob = (base64encoded) => {
  const decodedFile = Buffer.from(base64encoded, 'base64');

  return isBinary(decodedFile) ? decodedFile : decodedFile.toString('utf8');
};

const buildHeader = (fileA, fileB) => `diff --git a/${fileA} b/${fileB}\n` +
  `--- a/${fileA}\n` +
  `+++ b/${fileB}\n`;


const getContent = async (github, owner, repo, path, commit) => {
  try {
    const res = await github.repos.getContent({
      owner,
      repo,
      path,
      ref: commit,
    })

    return res.data.content;
  } catch (err) {
    try {
      const apiError = JSON.parse(err);
      if (apiError.errors.find((error) => error.code === 'too_large')) {
        const gitTree = await github.gitdata.getTree({
          owner,
          repo,
          // May hit githubs maximum limit if the tree is too large
          // we could handle larger trees if we recursively fetched subtrees.
          // see https://developer.github.com/v3/git/trees/#get-a-tree-recursively
          recursive: true,
          sha: commit
        });

        const { sha } = gitTree.tree.find((file) => file.path === path) || {};
        const data = await github.gitdata.getBlob({
          owner,
          repo,
          sha
        });

        return data.content;
      }

      throw err;
    } catch (parseError) {
      throw new Error(`Unable to get content for ${path} @commit:${commit}. ${err}`);
    }
  }
};

const buildContent = async ({
  github,
  owner,
  repo,
  base,
  head,
  file
}) => {
  const { filename, patch, status } = file;
  let content;
  // Get the content for the files
  if (status === 'removed') {
    content = await getContent(github, owner, repo, filename, base)

    return {
      filename,
      patch,
      status,
      header: buildHeader(filename, filename),
      fileA: atob(content),
    };

  } else if (status === 'added') {
    content = await getContent(github, owner, repo, filename, head)

    return {
      filename,
      patch,
      status,
      header: buildHeader(filename, filename),
      fileB: atob(content),
    };

  } else if (status === 'modified') {
    const [fileA, fileB] = await Promise.all([
      getContent(github, owner, repo, filename, base),
      getContent(github, owner, repo, filename, head),
    ]);

    return {
      filename,
      patch,
      status,
      header: buildHeader(filename, filename),
      fileA: atob(fileA),
      fileB: atob(fileB),
    };

  } else if (status === 'renamed') {
    content = await getContent(github, owner, repo, filename, head);
    const decodedFile = atob(content);
    const previousFilename = file.previous_filename;
    const header = buildHeader(filename, previousFilename);

    return {
      filename,
      patch,
      status,
      header,
      previousFilename,
      fileA: decodedFile,
      fileB: decodedFile,
    };
  }

  return {
    filename,
    patch,
    status,
    header: buildHeader(filename, filename),
  };
}

const compareCommits = async (github, owner, repo, base, head) => {

  try {
    const res = await github.repos.compareCommits({
      owner,
      repo,
      base,
      head,
    });

    const comparedCommits = res.data.files.map((file) => {
      const content = {
        github,
        owner,
        repo,
        base,
        head,
        file,
      };

      return buildContent(content);
    });

    const commits = await Promise.all(comparedCommits);

    return commits;
  } catch (err) {
    throw new Error(`Unable to access the github repository for ${repo}. ${err}`);
  }
};

const getDiff = async (githubRepo, base, head) => {

  try {
    // Setup the github api
    const github = new GithubApi({
      baseUrl: 'https://api.github.com',
      requestMedia: 'application/vnd.github.v3+json',
      headers: {
        // GitHub is happy with a unique user agent
        'user-agent': 'github-diff',
      },
      // Agent: undefined,
    });

    // eslint-disable-next-line no-process-env
    const token = process.env.GITHUB_DIFF_TOKEN;
    const [owner, repo] = githubRepo.split('/');

    // Check if the user has set a token and then authenticate
    if (token) {
      // Github api is restful and stateless,
      // so authenticate is a sync function that just modifies the rest calls
      github.authenticate({
        type: 'token',
        token,
      });
    }

    const data = await compareCommits(
      github,
      owner,
      repo,
      base,
      head
    );

    return data;
  } catch (error) {
    throw error;
  }
};

module.exports = getDiff;
