'use strict';

const { FIX_STAGES, VERSION, nowIso } = require('./schema');
const { parseGoal } = require('./goal-parser');

function createFixPlan(goal) {
  const parsed = parseGoal(goal);
  const actions = FIX_STAGES.map((stage, index) => ({
    id: stage.replace(/[^a-z0-9]+/gi, '_').toLowerCase(),
    stage,
    order: index + 1,
    issueIds: index === 0 ? ['qa_medium_onboarding_next_step'] : [],
    command: index === 4 ? `tools\\bridge.cmd cinematic polish "${parsed.goal}"` : index === 8 ? `tools\\bridge.cmd premium polish "${parsed.goal}"` : `tools\\bridge.cmd qa ${index === 7 ? 'regression' : 'report'} "${parsed.goal}"`,
    expectedRisk: index === 0 ? 'medium' : 'low',
    validationCommand: `tools\\bridge.cmd qa launch "${parsed.goal}"`,
    rollbackNote: 'Codex-owned QA manifests/markers can be removed without touching production gameplay.',
    safety: index === 0 ? 'readOnlyPlanFirst' : 'readOnlyOrCodexOwnedMutation',
    manualRequired: false,
  }));
  return { ok: true, version: VERSION, at: nowIso(), goal: parsed.goal, actions, warnings: [], blockers: [], nextCommand: `tools\\bridge.cmd qa regression "${parsed.goal}"` };
}

module.exports = { createFixPlan };
