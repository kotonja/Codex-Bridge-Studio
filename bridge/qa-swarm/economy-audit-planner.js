'use strict';

const { ECONOMY_CHECKS, VERSION, nowIso } = require('./schema');
const { parseGoal } = require('./goal-parser');

function createEconomyAuditPlan(goal) {
  const parsed = parseGoal(goal);
  const checks = ECONOMY_CHECKS.map((label) => ({
    id: label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''),
    label,
    mode: label.includes('DataStore') || label.includes('monetization') || label.includes('purchase') ? 'blockedOrManualRequired' : 'readOnlyAudit',
    command: label.includes('DataStore') || label.includes('monetization') ? 'manualRequired: inspect config/source; do not mutate live economy' : 'tools\\bridge.cmd watch now',
    safety: label.includes('DataStore') || label.includes('monetization') || label.includes('purchase') ? 'manualRequired' : 'readOnly',
    passCriteria: ['clear display/feedback', 'no accidental purchase path', 'no live DataStore mutation'],
  }));
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: parsed.goal,
    checks,
    unsafeMutationPolicy: 'DataStore, save/economy, purchase, monetization, and live balance mutation are manualRequired/blocked.',
    manualRequired: true,
    manualRequiredReason: 'Economy validation is read-only by default; live economy mutation is not auto-run.',
    warnings: ['Economy tests must not grant purchases or mutate saves automatically.'],
    blockers: [],
    nextCommand: `tools\\bridge.cmd qa multiplayer "${parsed.goal}"`,
  };
}

module.exports = { createEconomyAuditPlan };
