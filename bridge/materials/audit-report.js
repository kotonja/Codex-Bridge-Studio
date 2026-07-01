'use strict';

const { AUDIT_KEYS, nowIso, safeGoal } = require('./schema');

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function createMaterialAudit(goal, context = {}, options = {}) {
  const palette = context.palette || {};
  const budget = context.budget || {};
  const materialCount = Array.isArray(palette.materials) ? palette.materials.length : 0;
  const lightsOk = budget.plannedLights == null || budget.plannedLights <= (budget.maxLightsMobile || 8);
  const scores = {
    paletteCoherence: clamp(78 + Math.min(10, materialCount)),
    materialDiscipline: clamp(82),
    trimContrast: clamp(80),
    glowDiscipline: clamp(lightsOk ? 84 : 68),
    lightingDepth: clamp(lightsOk ? 82 : 72),
    atmosphereClarity: clamp(context.atmosphere ? 81 : 70),
    mobileLightSafety: clamp(lightsOk ? 88 : 62),
    surfaceAppearanceReadiness: clamp(76),
    premiumMaterialFeel: clamp(83),
    referenceMoodSupport: clamp(82),
  };
  const overallScore = clamp(Object.values(scores).reduce((sum, value) => sum + value, 0) / AUDIT_KEYS.length);
  return {
    ok: true,
    version: options.version,
    at: nowIso(),
    goal: safeGoal(goal),
    requiredScores: AUDIT_KEYS,
    scores,
    overallScore,
    rating: overallScore >= 86 ? 'premiumReady' : overallScore >= 76 ? 'solidNeedsPolish' : 'needsMaterialDirection',
    warnings: lightsOk ? [] : ['Mobile light budget needs reduction before live use.'],
    blockers: [],
    nextCommand: `tools\\bridge.cmd materials polish "${safeGoal(goal)}"`,
  };
}

module.exports = {
  createMaterialAudit,
};
