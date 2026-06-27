'use strict';

const { VERSION, POLISH_STAGES, nowIso, safeGoal } = require('./schema');

function createPolishPlan(goal, audit = null) {
  const cleanGoal = safeGoal(goal || (audit && audit.goal));
  const stages = POLISH_STAGES.map((stage, index) => ({
    index: index + 1,
    stage,
    target: index < 2 ? 'spawn and primary focal landmark' : index < 7 ? 'main route and gameplay zones' : 'mobile/performance/QA layer',
    reason: audit && audit.overallScore < 82 ? 'Audit score needs stronger premium readability.' : 'Lock in premium layout clarity before content expansion.',
    expectedVisualImprovement: `${stage} improves player read, screenshot quality, and premium world feel.`,
    command: index === 5 || index === 8 ? `tools\\bridge.cmd assetforge polish "${cleanGoal}"` : index === 9 ? `tools\\bridge.cmd visual critique "${cleanGoal}"` : index === 10 ? `tools\\bridge.cmd worldgen route "${cleanGoal}"` : `tools\\bridge.cmd worldgen generate "${cleanGoal}"`,
    safetyClassification: index >= 9 ? 'readOnlyValidation' : 'fullTrustCodexOwnedWorldgen',
    actionType: index >= 9 ? 'readOnly' : 'codexOwnedMutation',
  }));
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: cleanGoal,
    stages,
    assetForgeActions: [
      `tools\\bridge.cmd assetforge kit "${cleanGoal}"`,
      `tools\\bridge.cmd assetforge polish "${cleanGoal}"`,
    ],
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd worldgen generate "${cleanGoal}"`,
  };
}

module.exports = { createPolishPlan };
