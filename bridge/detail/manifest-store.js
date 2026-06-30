'use strict';

const { ROOTS, VERSION, detailManifestPath, nowIso, safeGoal, slugify } = require('./schema');

function manifestPath(goal, suffix = 'Preview') {
  return detailManifestPath(goal, suffix);
}

function createManifest(goal, data = {}) {
  const clean = safeGoal(goal);
  const suffix = data.suffix || 'Preview';
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: clean,
    detailId: `${slugify(clean, 'detail')}_${suffix}`,
    workspacePath: data.basePath || `${ROOTS.workspace}.${slugify(clean, 'detail')}_${suffix}`,
    manifestPath: manifestPath(clean, suffix),
    replicatedStorageRoot: ROOTS.replicatedStorage,
    premiumMirrorPath: `${ROOTS.premiumMirror}.${slugify(clean, 'detail')}_${suffix}`,
    styleId: data.styleId,
    systems: data.systems || {},
    operationCount: Array.isArray(data.operations) ? data.operations.length : 0,
    budget: data.budget || null,
    audit: data.audit || null,
    polishPlan: data.polishPlan || null,
    manualRequired: data.manualRequired || [],
    warnings: data.warnings || [],
    blockers: data.blockers || [],
    nextCommand: `tools\\bridge.cmd detail execute-preview "${clean}"`,
  };
}

module.exports = {
  createManifest,
  manifestPath,
};
