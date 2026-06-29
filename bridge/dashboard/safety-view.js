'use strict';

const { VERSION, DASHBOARD_URL, redact } = require('./schema');

function createSafetyView(extra = {}) {
  return {
    ok: true,
    version: VERSION,
    localOnly: true,
    url: DASHBOARD_URL,
    bindHost: '127.0.0.1',
    noExternalExposure: true,
    noFrontendApiKey: true,
    noRobloxPluginApiKey: true,
    noRawImageBytesStoredByDefault: true,
    noRawShellExecution: true,
    mutationsRequireExecutionKernel: true,
    approvalRequiredForApply: true,
    rollbackRequiresReceipt: true,
    blockedExternalRisks: ['publish', 'upload', 'marketplace', 'DataStore/save/economy', 'monetization', 'non-Codex mutation'],
    ...redact(extra),
  };
}

module.exports = { createSafetyView };
