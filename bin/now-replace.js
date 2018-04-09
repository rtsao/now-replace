#!/usr/bin/env node

const mri = require('mri');
const fetch = require('node-fetch');

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

  const authHeaders = {
    Authorization: `Bearer: ${token}`
  };

  deploymentUrl = normalizeUrl(deploymentUrl);
  aliasUrl = normalizeUrl(aliasUrl);

  async function getDeploymentId(deploymentUrl) {
    const req = await fetch('https://api.zeit.co/v2/now/deployments', {
      headers: authHeaders
    });
    const json = await req.json();
    return json.deployments.find(({url}) => url === deploymentUrl).uid;
  }

  async function getAliasedDeployment(aliasUrl) {
    const req = await fetch('https://api.zeit.co/v2/now/deployments', {
      headers: authHeaders
    });
    const json = await req.json();
    const found = json.aliases.find(({alias}) => alias === aliasUrl);
    if (found) {
      return found.deployment;
    }
  }
  function createAlias(uid, aliasUrl) {
    return fetch(`https://api.zeit.co/v2/now/deployments/${uid}/aliases`, {
      method: 'POST',
      body: JSON.stringify({
        alias: aliasUrl
      }),
      headers: {
        ...authHeaders,
        'Contet-Type': 'application/json'
      }
    });
  }

  function deleteDeployment(uid) {
    return fetch(`https://api.zeit.co/v2/now/deployments/${uid}`, {
      method: 'DELETE',
      headers: authHeaders
    });
  }

  let uid;
  let existing;
  try {
    [uid, existing] = await Promise.all([
      getDeploymentId(deploymentUrl),
      getAliasedDeployment(aliasUrl)
    ]);
  } catch (err) {
    throw err;
  }

  if (existing && existing.id === uid) {
    return;
  }

  try {
    await createAlias(uid, aliasUrl);
  } catch (err) {
    throw err;
  }

  if (existing) {
    try {
      deleteDeployment(existing.id);
    } catch (err) {
      throw err;
    }
  }
}

function normalizeUrl(url) {
  const leadingProtocol = /^https:\/\//;
  const trailingSlash = /\/$/;
  url = url.replace(trailingSlash, '');
  url = url.replace(leadingProtocol, '');
  if (!url.includes('.')) {
    url += '.now.sh';
  }
  return url;
}
