'use strict';

const { ROUTE_IDS, VERSION, nowIso } = require('./schema');
const { parseGoal } = require('./goal-parser');

function createRouteTestPlan(goal) {
  const parsed = parseGoal(goal);
  const routes = ROUTE_IDS.map((id, index) => ({
    id,
    waypoints: ['spawn', id.replace(/^spawn_to_/, '').replace(/_/g, ' '), 'return/snapshot'],
    expectedObservations: ['no stuck state', 'clear landmark', 'objective remains readable'],
    stuckDetection: { timeoutSeconds: 8 + index, maxNoProgressSeconds: 4, evidence: 'movement trail + watch snapshot' },
    timeoutSeconds: 25 + index * 3,
    collisionRisk: index % 3 === 0 ? 'medium' : 'low',
    pathfindingRisk: id.includes('clutter') ? 'high' : 'medium',
    command: `tools\\bridge.cmd test path <${id}-path.json>`,
    manualRequired: true,
    manualRequiredReason: 'Route execution needs live Play/Test character and generated waypoint file; this plan does not fake movement.',
  }));
  return { ok: true, version: VERSION, at: nowIso(), goal: parsed.goal, routes, warnings: [], blockers: [], nextCommand: `tools\\bridge.cmd qa ui "${parsed.goal}"` };
}

module.exports = { createRouteTestPlan };
