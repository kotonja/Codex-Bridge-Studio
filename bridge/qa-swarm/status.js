'use strict';

const { CAPABILITIES, ROOTS, VERSION, nowIso } = require('./schema');

function createStatus() {
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    status: 'ready',
    roots: ROOTS,
    capabilities: CAPABILITIES,
    integrations: {
      premiumDirector: true,
      visualCritic: true,
      worldgen: true,
      assetforge: true,
      cinematic: true,
      testPilot: true,
      actionBridge: true,
      cameraScreen: true,
      outputDiagnostics: true,
    },
    warnings: [],
    blockers: [],
    nextCommand: 'tools\\bridge.cmd qa plan "premium anime dungeon hub launch QA"',
  };
}

module.exports = { createStatus };
