'use strict';

const { materialManifestPath, nowIso, safeGoal, slugify } = require('./schema');

function createMaterialManifest(goal, context = {}, options = {}) {
  const suffix = options.suffix || context.suffix || 'Preview';
  return {
    ok: true,
    version: options.version,
    at: nowIso(),
    goal: safeGoal(goal),
    materialId: slugify(goal, 'materials'),
    manifestPath: materialManifestPath(goal, suffix),
    styleId: context.styleId,
    palette: context.palette,
    lighting: context.lighting,
    atmosphere: context.atmosphere,
    fixturePlan: context.fixturePlan,
    glowPlan: context.glowPlan,
    budget: context.budget,
    audit: context.audit,
    polishPlan: context.polishPlan,
    manualRequired: context.manualRequired || [],
    warnings: context.warnings || [],
    blockers: context.blockers || [],
    nextCommand: `tools\\bridge.cmd materials audit "${safeGoal(goal)}"`,
  };
}

module.exports = {
  createMaterialManifest,
};
