'use strict';

function createMobileBudget(families = []) {
  const limits = {};
  for (const family of families) {
    limits[family.id] = {
      maxPartsPerVariant: family.priority <= 2 ? 80 : 32,
      maxLights: family.role.includes('lighting') || family.role.includes('portal') ? 2 : 0,
      maxEmitters: family.role.includes('vfx') || family.role.includes('portal') ? 4 : 1,
      maxTransparentLayers: family.role.includes('portal') ? 3 : 1,
      collisionProxyRequired: true,
      lodRequired: family.priority <= 2,
    };
  }
  return {
    limits,
    fallbackRules: ['collapse tiny trim', 'replace SurfaceAppearance with built-in material', 'disable non-critical emitters', 'use collision proxies only'],
    performanceRisks: ['transparent overdraw', 'too many unique material variants', 'unanchored decorative parts', 'tiny collidable trim'],
  };
}

module.exports = { createMobileBudget };
