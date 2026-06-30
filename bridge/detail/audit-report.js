'use strict';

const { AUDIT_KEYS, clampScore, nowIso } = require('./schema');

function createAuditReport(goal, compilePlan = {}) {
  const ops = compilePlan.operations || [];
  const hasRole = (role) => ops.some((op) => String(op.role || '').includes(role));
  const scores = {
    silhouetteStrength: hasRole('portal') || hasRole('macro') ? 84 : 68,
    macroShapeReadability: hasRole('portalGate') || hasRole('pathSlab') ? 86 : 70,
    trimAndBevelDepth: ops.filter((op) => /trim|bevel|rune|rivet/i.test(op.role || '')).length >= 8 ? 82 : 64,
    materialVariety: new Set(ops.map((op) => op.properties && op.properties.Material).filter(Boolean)).size >= 4 ? 84 : 66,
    scaleHierarchy: ops.filter((op) => op.className === 'Part').length >= 20 ? 82 : 70,
    propDensity: ops.filter((op) => /prop|crystal|board|chest/i.test(op.role || '')).length >= 6 ? 80 : 60,
    lightingFixtureClarity: ops.filter((op) => /Light$/.test(op.className || '')).length >= 3 ? 82 : 58,
    socketCoverage: ops.filter((op) => op.className === 'Attachment').length >= 6 ? 86 : 60,
    collisionProxyCoverage: ops.filter((op) => /collisionProxy/i.test(op.role || '')).length >= 3 ? 78 : 50,
    mobilePartBudget: compilePlan.budget ? compilePlan.budget.mobileBudgetScore : 76,
    vfxReadiness: ops.filter((op) => /vfx/i.test(op.role || '')).length >= 4 ? 84 : 62,
    premiumDetailFeel: 80,
  };
  const overallScore = clampScore(Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length);
  return {
    ok: true,
    version: compilePlan.version,
    at: nowIso(),
    goal,
    requiredKeys: AUDIT_KEYS,
    scores,
    overallScore,
    rating: overallScore >= 85 ? 'premiumReady' : overallScore >= 74 ? 'solidNeedsPolish' : 'placeholderRisk',
    topIssues: Object.entries(scores)
      .filter(([, score]) => score < 75)
      .map(([key, score]) => ({ key, score, fix: `Run detail polish to improve ${key}.` })),
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd detail polish "${goal}"`,
  };
}

module.exports = {
  createAuditReport,
};
