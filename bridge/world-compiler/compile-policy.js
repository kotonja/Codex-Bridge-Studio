'use strict';

const { SAFETY } = require('./schema');

function createPolicyReport() {
  return {
    safety: SAFETY,
    buildPolicy: 'planOnlyUntilV72Apply',
    studioMutationPolicy: 'none',
    externalRiskPolicy: 'blockedOrManualRequired',
    allowedOutputs: [
      'structured compile package',
      'V72 execution preview plan',
      'redacted memory summary',
      'specialist bridge hints',
    ],
    forbiddenOutputs: [
      'raw image byte storage',
      'fake pixel/object detection',
      'direct non-Codex Studio mutation',
      'publish/upload/marketplace/DataStore/economy mutation',
    ],
  };
}

module.exports = { createPolicyReport };
