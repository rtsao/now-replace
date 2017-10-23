#!/usr/bin/env node

const mri = require('mri');

const flags = mri(process.argv.slice(2), {
  alias: {
    t: 'token'
  },
  string: ['token']
});

const [alias, deployment] = flags._;

if (!deployment || !alias) {
  throw new Error('deployment and alias are required');
}

setAlias(alias, deployment, flags.token);

async function setAlias(aliasUrl, deploymentUrl, token) {
  if (!token) {
    const {homedir} = require('os');
    const {join} = require('path');
    try {
      token = require(join(homedir(), '.now/auth.json')).credentials.find(
        ({provider}) => provider === 'sh'
      ).token;
    } catch (e) {
      throw new Error(
        'No token provided and could not locate in home directory'
      );
    }
  }

  const NowClient = require('now-client');
  now = new NowClient(token);
  deploymentUrl = normalizeUrl(deploymentUrl);
  aliasUrl = normalizeUrl(aliasUrl);

  async function getDeploymentId(deploymentUrl) {
    const deployments = await now.getDeployments();
    return deployments.find(({url}) => url === deploymentUrl).uid;
  }

  async function getAliasedDeployment(aliasUrl) {
    const aliases = await now.getAliases();
    return aliases.find(({alias}) => alias === aliasUrl).deployment;
  }

  const [uid, existing] = await Promise.all([
    getDeploymentId(deploymentUrl),
    getAliasedDeployment(aliasUrl)
  ]);

  if (existing && existing.id === uid) {
    return;
  }

  await now.createAlias(uid, aliasUrl);

  now.deleteDeployment(existing.uid);
}

const leadingProtocol = /^https:\/\//;
const trailingSlash = /\/$/;

function normalizeUrl(url) {
  url = url.replace(trailingSlash, '');
  url = url.replace(leadingProtocol, '');
  if (!url.includes('.')) {
    url += '.now.sh';
  }
  return url;
}
