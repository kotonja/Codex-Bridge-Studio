'use strict';

const { POLISH_STAGES, nowIso } = require('./schema');

function createPolishPlan(goal, audit = {}) {
  const weakKeys = Object.entries(audit.scores || {})
    .filter(([, score]) => Number(score) < 78)
    .map(([key]) => key);
  const stages = POLISH_STAGES.map((stage, index) => ({
    id: `detail_polish_${index + 1}`,
    stage,
    priority: weakKeys.length && index < weakKeys.length ? 'high' : 'normal',
    targetWeakKey: weakKeys[index] || null,
    expectedEffect: index < 4 ? 'stronger silhouette and less flat geometry' : 'better readability, sockets, and mobile budget',
  }));
  return {
    ok: true,
    version: audit.version,
    at: nowIso(),
    goal,
    weakKeys,
    stages,
    manualRequired: [],
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd detail execute-preview "${goal}"`,
  };
}

module.exports = {
  createPolishPlan,
};
