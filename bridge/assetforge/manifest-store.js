'use strict';

const { ROOTS, VERSION, goalId, hashGoal, nowIso } = require('./schema');

function manifestPath(goal) {
  return `${ROOTS.replicatedStorage}.${goalId(goal)}`;
}

function createManifest(goal, parts = {}) {
  const id = parts.assetKitId || `assetkit_${goalId(goal)}_${hashGoal(goal).slice(0, 6)}`;
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal,
    assetKitId: id,
    roots: ROOTS,
    plan: parts.plan,
    kitPlan: parts.kitPlan,
    meshPlan: parts.meshPlan,
    materialPlan: parts.materialPlan,
    socketPlan: parts.socketPlan,
    budget: parts.budget,
    audit: parts.audit,
    polishPlan: parts.polishPlan,
    manifestPath: `${ROOTS.replicatedStorage}.${id}`,
    workspacePath: `${ROOTS.workspace}.AssetKit_${id}`,
    premiumMirrorPath: `${ROOTS.premiumMirror}.${id}`,
    worldgenMirrorPath: `${ROOTS.worldgenMirror}.${id}`,
    warnings: parts.warnings || [],
    blockers: parts.blockers || [],
    nextCommand: `tools\\bridge.cmd visual critique "${goal}"`,
  };
}

module.exports = { createManifest, manifestPath };
