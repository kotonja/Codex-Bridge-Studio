'use strict';

const { ROOTS, VERSION } = require('./schema');

function createRollbackPlan(goal, roundIndex = 1) {
  return {
    version: VERSION,
    strategy: 'Codex-owned versioned rollback',
    undoAvailable: true,
    protectedUserContent: true,
    checkpointCommand: `tools\\bridge.cmd waypoint "Before Autopilot round ${roundIndex}"`,
    removableRoots: [ROOTS.workspace, ROOTS.replicatedStorage],
    notes: [
      'Only Codex-owned generated paths are eligible for automatic cleanup.',
      'Non-Codex scripts, saves, economy, monetization, publish, upload, and marketplace changes are never auto-applied.',
      `Goal: ${goal}`,
    ],
  };
}

module.exports = { createRollbackPlan };
