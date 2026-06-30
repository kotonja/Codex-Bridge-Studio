'use strict';

const { AUDIT_KEYS, VERSION, clampScore, nowIso } = require('./schema');

function createArchitectureAudit(goal, compiled) {
  const ops = compiled.operations || [];
  const roles = new Set(ops.map((op) => op.role));
  const budget = compiled.budget || {};
  const has = (role) => Array.from(roles).some((item) => String(item).includes(role));
  const scores = {
    silhouetteStrength: has('portal') || has('baseSilhouette') ? 86 : 74,
    modularConsistency: has('wallBay') ? 84 : 72,
    archQuality: has('archSegment') && has('keystone') ? 86 : 70,
    wallRhythm: has('wallBay') ? 82 : 70,
    depthLayering: has('depthLayer') || has('trimDepth') ? 84 : 68,
    trimDiscipline: has('Trim') || has('trim') ? 82 : 70,
    roofReadability: has('roof') ? 80 : 72,
    doorWindowQuality: has('door') || has('window') ? 80 : 72,
    interiorReadability: has('room') || has('interior') ? 78 : 72,
    collisionClarity: (budget.collisionProxyCount || 0) > 0 ? 84 : 64,
    mobileBudgetSafety: budget.densityRisk === 'high' ? 68 : budget.densityRisk === 'medium' ? 82 : 90,
    premiumArchitectureFeel: 82,
  };
  const overallScore = clampScore(AUDIT_KEYS.reduce((sum, key) => sum + clampScore(scores[key]), 0) / AUDIT_KEYS.length);
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal,
    requiredKeys: AUDIT_KEYS,
    scores,
    overallScore,
    rating: overallScore >= 88 ? 'premiumReady' : overallScore >= 78 ? 'solidNeedsPolish' : 'needsArchitecturePass',
    topIssues: overallScore >= 82 ? [] : ['Increase wall rhythm, collision clarity, and depth layering before live build.'],
    warnings: compiled.warnings || [],
    blockers: compiled.blockers || [],
    nextCommand: `tools\\bridge.cmd architecture polish "${goal}"`,
  };
}

module.exports = { createArchitectureAudit };
