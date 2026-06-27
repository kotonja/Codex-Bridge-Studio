'use strict';

const { COMBAT_CHECKS, VERSION, nowIso } = require('./schema');
const { parseGoal } = require('./goal-parser');

function createCombatTestPlan(goal) {
  const parsed = parseGoal(goal);
  const checks = COMBAT_CHECKS.map((label) => ({
    id: label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''),
    label,
    cinematicIntegration: ['hit feedback', 'camera shake comfort', 'VFX/audio sync'].includes(label),
    command: label.includes('VFX') || label.includes('camera') ? `tools\\bridge.cmd cinematic audit "${parsed.goal}"` : `tools\\bridge.cmd test snapshot`,
    expectedEvidence: ['input/readiness signal', 'watch summary', 'Output since baseline'],
    passCriteria: ['clear contact timing', 'cooldown/readiness communicated', 'no fresh errors'],
    failCriteria: ['weak impact', 'missing target feedback', 'camera discomfort', 'output error'],
  }));
  return { ok: true, version: VERSION, at: nowIso(), goal: parsed.goal, checks, warnings: [], blockers: [], nextCommand: `tools\\bridge.cmd qa economy "${parsed.goal}"` };
}

module.exports = { createCombatTestPlan };
