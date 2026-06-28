'use strict';

const { VERSION, nowIso } = require('./schema');
const { parseGoal } = require('./goal-parser');
const { createPolicy } = require('./loop-policy');
const { routeSpecialists } = require('./specialist-router');

function createProductionPlan(goal) {
  const parsed = parseGoal(goal);
  const policy = createPolicy(parsed.policyId);
  const routed = routeSpecialists(parsed.goalClass, policy);
  return {
    version: VERSION,
    ok: true,
    at: nowIso(),
    goal: parsed.goal,
    autopilotId: parsed.autopilotId,
    policyId: policy.id,
    goalClass: parsed.goalClass,
    specialists: {
      premium: routed.some((item) => item.id === 'premium'),
      worldgen: routed.some((item) => item.id === 'worldgen'),
      assetforge: routed.some((item) => item.id === 'assetforge'),
      visual: routed.some((item) => item.id === 'visual'),
      cinematic: routed.some((item) => item.id === 'cinematic'),
      qa: routed.some((item) => item.id === 'qa'),
    },
    specialistRoutes: routed,
    rounds: [1, 2, 3].slice(0, policy.maxRounds).map((roundIndex) => ({
      roundIndex,
      goal: parsed.goal,
      focus: roundIndex === 1 ? 'baseline build and critique' : roundIndex === 2 ? 'evidence-linked fixes and polish' : 'retest and final score',
      maxMutations: policy.maxMutationsPerRound,
    })),
    acceptanceGates: ['fresh connection', 'plugin health clean', 'visual critique available or honestly unavailable', 'QA launch readiness scored', 'no blocked external risks', 'score target or stop condition reached'],
    safetyBudget: {
      maxRounds: policy.maxRounds,
      maxMutationsPerRound: policy.maxMutationsPerRound,
      maxRuntimeMs: policy.maxRuntimeMs,
      allowedMutationScopes: policy.allowedMutationScopes || [],
      blockedActions: policy.blockedActions,
      onlyCodexOwnedMutations: true,
    },
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd autopilot loop "${parsed.goal}"`,
  };
}

module.exports = { createProductionPlan };
