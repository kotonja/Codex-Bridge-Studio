'use strict';

const { ROOTS, VERSION, goalId, hashGoal, nowIso } = require('./schema');

function manifestPath(goal) {
  return `${ROOTS.replicatedStorage}.${goalId(goal)}_${hashGoal(goal).slice(0, 6)}`;
}

function createManifest(parsed, parts) {
  const path = manifestPath(parsed.goal);
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    name: parsed.packageId,
    goal: parsed.goal,
    styleId: parsed.styleId,
    momentType: parsed.momentType,
    qualityTarget: parsed.qualityTarget,
    manifestPath: path,
    workspacePath: `${ROOTS.workspace}.Cinematic_${parsed.packageId}`,
    premiumMirrorPath: `${ROOTS.premiumMirror}.${parsed.packageId}`,
    assetForgeSocketPath: `${ROOTS.assetForgeSockets}.${parsed.packageId}`,
    timeline: parts.timeline,
    animationPlan: parts.animationPlan,
    vfxSyncPlan: parts.vfxSyncPlan,
    audioSyncPlan: parts.audioSyncPlan,
    cameraPlan: parts.cameraPlan,
    gameFeelPlan: parts.gameFeelPlan,
    audit: parts.audit,
    warnings: parts.warnings || [],
    blockers: parts.blockers || [],
    nextCommand: `tools\\bridge.cmd cinematic preview "${parsed.goal}"`,
  };
}

module.exports = { createManifest, manifestPath };
