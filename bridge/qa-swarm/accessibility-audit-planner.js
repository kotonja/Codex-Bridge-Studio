'use strict';

const { ACCESSIBILITY_CHECKS, VERSION, nowIso } = require('./schema');
const { parseGoal } = require('./goal-parser');

function createAccessibilityAuditPlan(goal) {
  const parsed = parseGoal(goal);
  const checks = ACCESSIBILITY_CHECKS.map((label) => ({
    id: label.replace(/[^a-z0-9]+/gi, '_').toLowerCase(),
    label,
    evidence: label.includes('motion') || label.includes('shake') ? 'cinematic/gamefeel plan + visual critique' : 'visual critique + UI/action target report',
    exactFix: `Address ${label} with visual/QA polish before launch.`,
    suggestedCommand: label.includes('motion') || label.includes('shake') ? `tools\\bridge.cmd cinematic polish "${parsed.goal}"` : `tools\\bridge.cmd visual polish "${parsed.goal}"`,
  }));
  return { ok: true, version: VERSION, at: nowIso(), goal: parsed.goal, checks, warnings: [], blockers: [], nextCommand: `tools\\bridge.cmd qa launch "${parsed.goal}"` };
}

module.exports = { createAccessibilityAuditPlan };
