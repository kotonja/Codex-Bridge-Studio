'use strict';

const { VERSION, nowIso } = require('./schema');
const { parseGoal } = require('./goal-parser');

const STAGES = ['visual focal hierarchy', 'layout readability', 'asset/socket detail', 'cinematic timing', 'mobile density', 'output cleanliness', 'final premium pass'];

function createPolishPlan(goal) {
  const parsed = parseGoal(goal);
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: parsed.goal,
    autopilotId: parsed.autopilotId,
    stages: STAGES.map((stage) => ({
      stage,
      command: stage.includes('cinematic') ? `tools\\bridge.cmd cinematic polish "${parsed.goal}"` : stage.includes('asset') ? `tools\\bridge.cmd assetforge polish "${parsed.goal}"` : stage.includes('layout') ? `tools\\bridge.cmd worldgen polish "${parsed.goal}"` : `tools\\bridge.cmd visual polish "${parsed.goal}"`,
      safety: 'Codex-owned polish plan; manualRequired if target is not Codex-owned.',
      validationCommand: `tools\\bridge.cmd autopilot score "${parsed.goal}"`,
    })),
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd autopilot retest "${parsed.goal}"`,
  };
}

module.exports = { createPolishPlan };
