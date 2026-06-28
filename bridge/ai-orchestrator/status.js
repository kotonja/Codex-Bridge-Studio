'use strict';

const { VERSION, CAPABILITIES, INTEGRATIONS, nowIso } = require('./schema');
const { getApiKeyInfo } = require('./secret-policy');

function getStatus() {
  const keyInfo = getApiKeyInfo();
  return {
    version: VERSION,
    ok: true,
    configured: keyInfo.configured,
    apiKeySource: keyInfo.apiKeySource,
    keyPresent: keyInfo.keyPresent,
    pluginHasApiKey: false,
    capabilities: CAPABILITIES,
    integrations: INTEGRATIONS,
    at: nowIso(),
    warnings: keyInfo.configured ? [] : ['No API key configured; using local fallback plans only.'],
    blockers: [],
    nextCommand: 'tools\\bridge.cmd ai config',
  };
}

module.exports = {
  getStatus,
};
