'use strict';

const { POLISH_STAGES, nowIso } = require('./schema');

function createPolishPlan(goal, kitPlan, audit) {
  return {
    ok: true,
    version: kitPlan.version,
    at: nowIso(),
    goal,
    assetKitId: kitPlan.assetKitId,
    stages: POLISH_STAGES.map((stage, index) => ({
      index: index + 1,
      stage,
      targetAssetFamily: kitPlan.assetFamilies[index % kitPlan.assetFamilies.length].id,
      reason: audit && audit.subScores ? audit.subScores[Object.keys(audit.subScores)[index % Object.keys(audit.subScores).length]].exactFix : 'Improve premium asset readability.',
      expectedImprovement: 'Cleaner premium asset kit with better reuse, sockets, and mobile safety.',
      command: index >= 9 ? `tools\\bridge.cmd visual critique "${goal}"` : `tools\\bridge.cmd assetforge generate "${goal}"`,
      safetyClassification: index >= 9 ? 'readOnlyValidation' : 'fullTrustCodexOwnedAssetForge',
      actionType: index >= 9 ? 'readOnly' : 'codexOwnedMutation',
    })),
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd assetforge generate "${goal}"`,
  };
}

module.exports = { createPolishPlan };
