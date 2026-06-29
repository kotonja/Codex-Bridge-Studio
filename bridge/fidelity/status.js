'use strict';

const { CAPABILITIES, VERSION, base } = require('./schema');

function getStatus() {
  return base({
    status: 'ready',
    capabilities: CAPABILITIES,
    safety: {
      doesNotFakePixelComparison: true,
      doesNotMutateStudioDirectly: true,
      fixesRequireExecutionKernel: true,
      doesNotStoreRawImagesByDefault: true,
      doesNotPrintOrStoreApiKeys: true,
    },
    evidenceModes: ['profileBased', 'imageVisionBased', 'pixelBased', 'limited'],
    nextCommand: 'tools\\bridge.cmd fidelity compare "dark purple anime dungeon gate"',
  });
}

module.exports = { VERSION, getStatus };
