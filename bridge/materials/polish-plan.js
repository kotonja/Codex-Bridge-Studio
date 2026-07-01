'use strict';

const { POLISH_STAGES, nowIso, safeGoal } = require('./schema');

function createMaterialPolishPlan(goal, audit = {}, options = {}) {
  return {
    ok: true,
    version: options.version,
    at: nowIso(),
    goal: safeGoal(goal),
    auditScore: audit.overallScore,
    stages: POLISH_STAGES.map((stage, index) => ({
      id: `material_polish_${index + 1}`,
      stage,
      priority: index < 4 ? 'high' : 'normal',
      execution: index <= 5 ? 'V72 preview/apply against Codex-owned material operations' : 'manifest or follow-up QA',
    })),
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd materials execute-preview "${safeGoal(goal)}"`,
  };
}

module.exports = {
  createMaterialPolishPlan,
};
