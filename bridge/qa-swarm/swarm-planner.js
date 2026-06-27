'use strict';

const { VERSION, nowIso } = require('./schema');
const { parseGoal } = require('./goal-parser');
const { getPersonaCatalog } = require('./persona-catalog');
const { createScenarioCatalog } = require('./scenario-planner');

function createAgent(persona, scenarios) {
  const scenarioIds = scenarios
    .filter((scenario) => scenario.personaIds.includes(persona.id))
    .slice(0, 4)
    .map((scenario) => scenario.id);
  return {
    id: `${persona.id}_agent`,
    personaId: persona.id,
    mission: persona.goal,
    scenarioIds: scenarioIds.length ? scenarioIds : [scenarios[0].id],
    maxSteps: persona.maxActions,
    allowedActions: ['observe', 'move', 'jump', 'clickUi', 'triggerPrompt', 'wait', 'snapshot'],
    blockedActions: ['purchase', 'publish', 'delete', 'saveData', 'externalUpload'],
    evidenceTargets: persona.evidenceNeeded,
    passCriteria: ['target evidence exists', 'no blocker issue', 'next action is clear'],
    failCriteria: persona.failureSignals,
  };
}

function createSwarmPlan(goal) {
  const parsed = parseGoal(goal);
  const personas = getPersonaCatalog();
  const scenarios = createScenarioCatalog(parsed.goal);
  const selected = personas.slice(0, 15);
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: parsed.goal,
    qaPlanId: parsed.qaPlanId,
    swarmId: parsed.swarmId,
    agents: selected.map((persona) => createAgent(persona, scenarios)),
    scenarios,
    schedule: {
      mode: 'sequential',
      reason: 'bounded local Studio execution; parallel is plan-only unless multiple paired local test clients are explicit',
    },
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd qa run "${parsed.goal}"`,
  };
}

module.exports = { createSwarmPlan };
