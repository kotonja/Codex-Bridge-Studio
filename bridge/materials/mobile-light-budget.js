'use strict';

const { nowIso, safeGoal } = require('./schema');

function createMaterialMobileBudget(goal, compiledOrPlans = {}, options = {}) {
  const operations = Array.isArray(compiledOrPlans.operations) ? compiledOrPlans.operations : [];
  const lights = operations.filter((op) => /Light$/.test(op.className || ''));
  const neonParts = operations.filter((op) => op.className === 'Part' && op.properties && op.properties.Material === 'Neon');
  const plannedLights = lights.length || compiledOrPlans.plannedLights || 5;
  const maxLightsMobile = 8;
  return {
    ok: plannedLights <= maxLightsMobile,
    version: options.version,
    at: nowIso(),
    goal: safeGoal(goal),
    plannedLights,
    neonPartCount: neonParts.length,
    maxLightsMobile,
    maxBrightness: 1.8,
    maxRange: 24,
    reductionPlan: ['keep portal light', 'keep two path guide lights', 'turn secondary crystal lights into Neon-only accents', 'disable shadows on low priority lights first'],
    warnings: plannedLights > maxLightsMobile ? [`Planned lights ${plannedLights} exceeds mobile budget ${maxLightsMobile}.`] : [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd materials audit "${safeGoal(goal)}"`,
  };
}

module.exports = {
  createMaterialMobileBudget,
};
