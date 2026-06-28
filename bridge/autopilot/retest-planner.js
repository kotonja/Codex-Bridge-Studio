'use strict';

const { VERSION, nowIso } = require('./schema');
const { parseGoal } = require('./goal-parser');

function createRetestPlan(goal) {
  const parsed = parseGoal(goal);
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: parsed.goal,
    autopilotId: parsed.autopilotId,
    commands: [
      'tools\\bridge.cmd plugin-health',
      'tools\\bridge.cmd output errors',
      `tools\\bridge.cmd visual critique "${parsed.goal}"`,
      `tools\\bridge.cmd qa launch "${parsed.goal}"`,
      `tools\\bridge.cmd premium score "${parsed.goal}"`,
    ],
    evidenceNeeded: ['fresh Output', 'visual critique', 'QA launch readiness', 'premium score'],
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd autopilot score "${parsed.goal}"`,
  };
}

module.exports = { createRetestPlan };
