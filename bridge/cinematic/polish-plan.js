'use strict';

const { POLISH_STAGES, VERSION, nowIso } = require('./schema');

function createPolishPlan(parsed, audit) {
  const actions = POLISH_STAGES.map((stage, index) => ({
    id: `polish_${String(index + 1).padStart(2, '0')}`,
    stage,
    targetMoment: index < 2 ? 'anticipation' : index < 6 ? 'impact' : index < 9 ? 'recovery' : 'wholeTimeline',
    reason: audit.overallScore >= 82 ? `Preserve premium quality while tightening ${stage}.` : `Improve ${stage} to lift the cinematic score.`,
    expectedImprovement: index < 8 ? '+2 to +5 readability/feel points' : 'verification confidence',
    command: index >= 10 ? `tools\\bridge.cmd cinematic audit "${parsed.goal}"` : `tools\\bridge.cmd cinematic timeline "${parsed.goal}"`,
    safetyClassification: index >= 10 ? 'readOnly' : 'readOnlyPlanOrCodexOwnedMutation',
    mode: index >= 10 ? 'readOnly' : 'codexOwnedMutation',
  }));
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: parsed.goal,
    stageCount: actions.length,
    stages: actions,
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd cinematic preview "${parsed.goal}"`,
  };
}

module.exports = { createPolishPlan };
