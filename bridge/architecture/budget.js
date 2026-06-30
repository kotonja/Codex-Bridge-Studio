'use strict';

const { VERSION, nowIso } = require('./schema');

function createBudgetReport(goal, operations = []) {
  const partCount = operations.filter((op) => op.className === 'Part' || op.className === 'MeshPart').length;
  const lightCount = operations.filter((op) => /Light$/.test(op.className || '')).length;
  const collisionProxyCount = operations.filter((op) => /collision/i.test(op.role || op.path || '')).length;
  const transparentGlowCount = operations.filter((op) => {
    const props = op.properties || {};
    return props.Material === 'Neon' || props.Material === 'Glass' || Number(props.Transparency || 0) > 0.25;
  }).length;
  const operationCount = operations.length;
  const densityRisk = operationCount > 140 ? 'high' : operationCount > 90 ? 'medium' : 'low';
  const mobileVariantReduction = {
    mergeTrimBands: operationCount > 90,
    reduceArchSegments: operationCount > 110,
    capLightsAt: 6,
    keepCollisionSimple: true,
  };
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal,
    operationCount,
    partCount,
    lightCount,
    collisionProxyCount,
    transparentGlowRisk: transparentGlowCount > 12 ? 'high' : transparentGlowCount > 6 ? 'medium' : 'low',
    mobileVariantReduction,
    silhouetteComplexity: partCount > 70 ? 'rich' : partCount > 35 ? 'moderate' : 'simple',
    densityRisk,
    warnings: densityRisk === 'high' ? ['Architecture operation density is high; use mobileLow variant or merge trim bands.'] : [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd architecture audit "${goal}"`,
  };
}

module.exports = { createBudgetReport };
