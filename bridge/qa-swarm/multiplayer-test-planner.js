'use strict';

const { VERSION, nowIso } = require('./schema');
const { parseGoal } = require('./goal-parser');

function createMultiplayerTestPlan(goal, options = {}) {
  const parsed = parseGoal(goal);
  const localAvailable = options.localMultiplayerAvailable === true;
  const checks = [
    'local multiplayer support availability',
    'player spawn separation',
    'replicated UI sanity',
    'shared world objects',
    'combat replication risks',
    'prompt ownership',
    'no unsafe teleport/purchase',
  ].map((label) => ({
    id: label.replace(/[^a-z0-9]+/gi, '_').toLowerCase(),
    label,
    command: localAvailable ? 'tools\\bridge.cmd play multiplayer 2' : 'manualRequired: open local multiplayer test when Studio exposes it',
    safety: label.includes('purchase') ? 'manualRequired' : 'boundedLocalPlan',
  }));
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: parsed.goal,
    localMultiplayerAvailable: localAvailable,
    manualRequired: !localAvailable,
    manualRequiredReason: localAvailable ? null : 'Roblox Studio local multiplayer control is not confirmed in this context; V69 returns a bounded plan instead of faking spawned players.',
    checks,
    warnings: localAvailable ? [] : ['Multiplayer execution is plan/manualRequired until local test players are available.'],
    blockers: [],
    nextCommand: `tools\\bridge.cmd qa performance "${parsed.goal}"`,
  };
}

module.exports = { createMultiplayerTestPlan };
