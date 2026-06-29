'use strict';

const { VERSION, CAPABILITIES, INTEGRATIONS, nowIso } = require('./schema');
const { getApiKeyInfo } = require('./secret-policy');
const { getConnectivitySummary } = require('./connectivity');

function getStatus() {
  const keyInfo = getApiKeyInfo();
  const connectivity = getConnectivitySummary();
  return {
    version: VERSION,
    ok: true,
    configured: keyInfo.configured,
    apiKeySource: keyInfo.apiKeySource,
    keyPresent: keyInfo.keyPresent,
    pluginHasApiKey: false,
    visionConnectivity: {
      status: connectivity.status,
      extraCaCertsConfigured: connectivity.extraCaCerts.configured,
      nodeExtraCaCertsSet: connectivity.tls.nodeExtraCaCertsSet,
      unsafeTlsDisabled: connectivity.tls.nodeTlsRejectUnauthorizedDisabled,
    },
    capabilities: CAPABILITIES,
    integrations: INTEGRATIONS,
    at: nowIso(),
    warnings: keyInfo.configured ? [] : ['No API key configured; using local fallback plans only.'],
    blockers: connectivity.blockers || [],
    nextCommand: 'tools\\bridge.cmd ai tls-check',
  };
}

module.exports = {
  getStatus,
};
