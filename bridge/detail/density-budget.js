'use strict';

const { clampScore } = require('./schema');

function createBudgetReport(goal, operations = [], options = {}) {
  const partCount = operations.filter((op) => op.className === 'Part' || op.className === 'MeshPart').length;
  const lightCount = operations.filter((op) => /Light$/.test(op.className || '')).length;
  const particleCount = operations.filter((op) => op.className === 'ParticleEmitter').length;
  const attachmentCount = operations.filter((op) => op.className === 'Attachment').length;
  const totalBudgetCost = operations.reduce((sum, op) => sum + Number(op.budgetCost || 0), 0);
  const mobileBudgetScore = clampScore(100 - Math.max(0, partCount - 80) * 0.9 - lightCount * 2 - particleCount * 4);
  const risk = mobileBudgetScore < 68 ? 'medium' : 'low';
  return {
    ok: true,
    version: options.version,
    goal,
    partCount,
    lightCount,
    particleCount,
    attachmentCount,
    totalBudgetCost: Math.round(totalBudgetCost * 10) / 10,
    mobileBudgetScore,
    risk,
    caps: {
      recommendedPartsMobile: 120,
      recommendedLightsMobile: 12,
      recommendedLiveParticleEmitters: 8,
    },
    warnings: risk === 'medium' ? ['Part/light density is approaching mobile readability budget; prefer large silhouette modules over tiny decoration.'] : [],
    blockers: [],
  };
}

module.exports = {
  createBudgetReport,
};
