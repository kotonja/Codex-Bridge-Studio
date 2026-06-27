'use strict';

function zoneDensityBudget(role, scale = 'medium') {
  const scaleFactor = { small: 0.7, medium: 1, large: 1.4, massive: 1.8 }[scale] || 1;
  const base = role === 'primaryFocalPoint' ? 160 : role === 'spawn' ? 110 : role === 'combat' ? 130 : 80;
  return {
    maxParts: Math.round(base * scaleFactor),
    maxLights: role === 'primaryFocalPoint' ? 5 : 2,
    maxParticleEmitters: role === 'primaryFocalPoint' ? 12 : 5,
    maxBeamsTrails: role === 'portal' || role === 'primaryFocalPoint' ? 8 : 3,
    transparentOverdraw: role === 'portal' || role === 'vista' ? 'medium' : 'low',
  };
}

function createPerformanceBudget(planOrGraph) {
  const zones = planOrGraph.zones || [];
  const byZone = {};
  for (const zone of zones) {
    byZone[zone.id] = zone.densityBudget || zoneDensityBudget(zone.role, planOrGraph.scale);
  }
  return {
    maxPartsByZone: Object.fromEntries(Object.entries(byZone).map(([id, budget]) => [id, budget.maxParts])),
    maxLightsByZone: Object.fromEntries(Object.entries(byZone).map(([id, budget]) => [id, budget.maxLights])),
    maxParticlesByZone: Object.fromEntries(Object.entries(byZone).map(([id, budget]) => [id, budget.maxParticleEmitters])),
    maxBeamsTrailsByZone: Object.fromEntries(Object.entries(byZone).map(([id, budget]) => [id, budget.maxBeamsTrails])),
    transparentOverdrawRisk: zones.some((zone) => zone.role === 'portal' || zone.role === 'primaryFocalPoint') ? 'medium' : 'low',
    scriptCountRisk: 'low; generated worldgen objects should be mostly data/parts, with scripts routed through existing Codex-owned systems only.',
    physicsCollisionRisk: 'medium; QA route must verify path collision and jump-free navigation on mobile.',
    mobileFallbackReductions: ['reduce transparent layers', 'halve secondary particle emitters', 'merge decorative trims', 'disable non-critical dynamic lights'],
  };
}

module.exports = { createPerformanceBudget, zoneDensityBudget };
