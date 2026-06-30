'use strict';

const { POLISH_STAGES, VERSION, nowIso } = require('./schema');

function createPolishPlan(goal, audit = {}) {
  const score = audit.overallScore || 0;
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal,
    scoreBefore: score,
    stages: POLISH_STAGES.map((stage, index) => ({
      index: index + 1,
      stage,
      priority: score < 80 && index < 5 ? 'high' : 'normal',
      expectedEffect: index < 3 ? 'stronger read at distance' : index < 8 ? 'cleaner modular language' : 'safer mobile and validation loop',
    })),
    warnings: audit.warnings || [],
    blockers: audit.blockers || [],
    nextCommand: `tools\\bridge.cmd architecture execute-preview "${goal}"`,
  };
}

module.exports = { createPolishPlan };
