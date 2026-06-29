'use strict';

const { CAPABILITIES, VERSION, base } = require('./schema');
const { getApiKeyInfo } = require('../ai-orchestrator/secret-policy');

function getStatus() {
  const keyInfo = getApiKeyInfo();
  return base({
    configured: keyInfo.configured,
    apiImageAnalysisAvailable: keyInfo.configured,
    noteOnlyModeAvailable: true,
    capabilities: CAPABILITIES,
    safety: {
      doesNotStoreRawImagesByDefault: true,
      doesNotFakeImageAnalysis: true,
      apiKeyInPlugin: false,
      readOnly: true,
    },
    warnings: keyInfo.configured ? [] : ['No API key configured; image files use metadata/note-only analysis.'],
    blockers: [],
    nextCommand: 'tools\\bridge.cmd reference intake "premium anime dungeon gate reference"',
    version: VERSION,
  });
}

module.exports = {
  getStatus,
};
