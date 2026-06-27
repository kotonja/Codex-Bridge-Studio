'use strict';

const { UI_CHECKS, VERSION, nowIso } = require('./schema');
const { parseGoal } = require('./goal-parser');

function createUiTestPlan(goal) {
  const parsed = parseGoal(goal);
  const checks = UI_CHECKS.map((label) => ({
    id: label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''),
    label,
    targetDiscovery: 'tools\\bridge.cmd action ui list',
    actionCommand: label.includes('spam') ? 'tools\\bridge.cmd action ui watch-after-click 5' : 'tools\\bridge.cmd action ui click --id <target-id>',
    expected: 'before/after UI summary, no fresh Output errors, unambiguous target selection',
    passCriteria: ['visible when expected', 'safe target id or manualRequired', 'no stale history treated as current'],
    failCriteria: ['ambiguous duplicate target without id', 'tiny tap target', 'clipped/truncated text'],
    safety: 'fullTrustLocalRuntimeActionOrManualRequired',
  }));
  return { ok: true, version: VERSION, at: nowIso(), goal: parsed.goal, checks, warnings: [], blockers: [], nextCommand: `tools\\bridge.cmd qa combat "${parsed.goal}"` };
}

module.exports = { createUiTestPlan };
