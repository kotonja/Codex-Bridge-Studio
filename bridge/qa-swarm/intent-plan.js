'use strict';

const { VERSION, nowIso } = require('./schema');
const { parseGoal } = require('./goal-parser');
const { getPersonaCatalog } = require('./persona-catalog');
const { createScenarioCatalog } = require('./scenario-planner');

function createQaPlan(goal) {
  const parsed = parseGoal(goal);
  const personas = getPersonaCatalog().slice(0, 8).map((persona) => persona.id);
  const scenarios = createScenarioCatalog(parsed.goal).slice(0, 12).map((scenario) => scenario.id);
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: parsed.goal,
    qaPlanId: parsed.qaPlanId,
    scope: parsed.scope,
    targetPlace: parsed.targetPlace,
    personas,
    scenarios,
    requiredEvidence: ['fresh Output baseline', 'watch/test snapshot', 'route or UI evidence', 'launch scorecard'],
    riskAreas: parsed.riskAreas,
    integrationsUsed: {
      worldgenRoutes: true,
      assetforgeSockets: true,
      visualCritic: true,
      cinematicTimelines: true,
      outputBaseline: true,
      testPilot: true,
    },
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd qa swarm "${parsed.goal}"`,
  };
}

module.exports = { createQaPlan };
