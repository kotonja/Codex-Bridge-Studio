'use strict';

const { CAPABILITIES, SAFETY, VERSION, base } = require('./schema');

function getStatus() {
  return base({
    ok: true,
    status: 'ready',
    capabilities: CAPABILITIES,
    safety: SAFETY,
    integrations: {
      referenceLab: true,
      structuralReconstruction: true,
      premiumDirector: true,
      worldgen: true,
      assetforge: true,
      cinematic: true,
      qaSwarm: true,
      executionKernel: true,
      productionMemory: true,
      autopilot: true,
    },
    warnings: [],
    blockers: [],
    nextCommand: 'tools\\bridge.cmd worldcompile image "<local-image-path>"',
    version: VERSION,
  });
}

module.exports = { getStatus };
