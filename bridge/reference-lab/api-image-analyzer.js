'use strict';

const { getApiKeyInfo } = require('../ai-orchestrator/secret-policy');

async function maybeAnalyzeImage(classification) {
  const keyInfo = getApiKeyInfo();
  if (!classification || classification.sourceKind !== 'image') {
    return { used: false, mode: 'noteOnly', warnings: [], blockers: [] };
  }
  if (!classification.available) {
    return { used: false, mode: 'unavailable', warnings: [], blockers: ['Image path is unavailable; cannot analyze pixels.'] };
  }
  if (!keyInfo.configured) {
    return {
      used: false,
      mode: 'metadataOnly',
      warnings: ['OPENAI_API_KEY is not configured; returning metadata-only image reference report.'],
      blockers: [],
    };
  }
  return {
    used: false,
    mode: 'metadataOnly',
    warnings: ['API key is configured, but V74 foundation does not send image bytes by default. Use a future explicit vision-enabled command for real pixel analysis.'],
    blockers: [],
    preparedRequest: {
      provider: 'OpenAI vision-capable model via V73 orchestrator',
      sendsRawImageOnlyWithExplicitAnalyzeCommand: true,
      storesRawImageBytes: false,
    },
  };
}

module.exports = {
  maybeAnalyzeImage,
};
