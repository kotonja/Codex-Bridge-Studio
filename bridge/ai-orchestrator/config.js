'use strict';

const { VERSION, DEFAULT_MODEL, MAX_STEPS, MAX_TOOL_CALLS, STORE_ROOT, nowIso } = require('./schema');
const { getApiKeyInfo } = require('./secret-policy');
const { getConnectivitySummary } = require('./connectivity');

function getConfig() {
  const keyInfo = getApiKeyInfo();
  const connectivity = getConnectivitySummary();
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    configured: keyInfo.configured,
    apiKeySource: keyInfo.apiKeySource,
    keyPresent: keyInfo.keyPresent,
    keyLast4: keyInfo.keyLast4,
    pluginHasApiKey: false,
    defaultModel: DEFAULT_MODEL,
    maxSteps: MAX_STEPS,
    maxToolCalls: MAX_TOOL_CALLS,
    storeRoot: STORE_ROOT,
    localSecretFile: '.codex-studio/secrets.local.json',
    visionConnectivity: {
      status: connectivity.status,
      extraCaCertsConfigured: connectivity.extraCaCerts.configured,
      nodeExtraCaCertsSet: connectivity.tls.nodeExtraCaCertsSet,
      unsafeTlsDisabled: connectivity.tls.nodeTlsRejectUnauthorizedDisabled,
    },
    safety: {
      keyInRobloxPlugin: false,
      keyCommittedToGit: false,
      runLogsRedacted: true,
      planOnlyDefault: true,
      executionKernelRequiredForMutation: true,
    },
    warnings: keyInfo.configured ? [] : ['OPENAI_API_KEY is not configured; AI runs return offline local fallback plans.'],
    blockers: [],
    nextCommand: keyInfo.configured ? 'tools\\bridge.cmd ai plan "premium anime dungeon hub"' : '$env:OPENAI_API_KEY="<your key>"; tools\\bridge.cmd ai status',
  };
}

module.exports = {
  getConfig,
};
