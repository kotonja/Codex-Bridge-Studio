'use strict';

const { CAPABILITIES, ROOTS, SAFETY, VERSION, nowIso } = require('./schema');

function createStatus() {
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    status: 'ready',
    category: 'detailCompiler',
    roots: ROOTS,
    capabilities: CAPABILITIES,
    safety: SAFETY,
    integrations: {
      executionKernel: true,
      dashboard: true,
      fidelity: true,
      worldcompile: true,
      assetforge: true,
      visualCritic: true,
      premiumDirector: true,
    },
    warnings: [],
    blockers: [],
    nextCommand: 'tools\\bridge.cmd detail plan "dark purple anime dungeon gate"',
  };
}

module.exports = {
  createStatus,
};
