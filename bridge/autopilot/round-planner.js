'use strict';

const { VERSION, nowIso } = require('./schema');
const { parseGoal } = require('./goal-parser');
const { createPolicy } = require('./loop-policy');
const { createRollbackPlan } = require('./rollback-plan');

function createRoundPlan(goal, options = {}) {
  const parsed = parseGoal(goal);
  const policy = createPolicy(parsed.policyId);
  const roundIndex = Number(options.roundIndex || 1);
  const phase = options.phase || (roundIndex === 1 ? 'build' : roundIndex === 2 ? 'polish' : 'retest');
  return {
    version: VERSION,
    ok: true,
    at: nowIso(),
    goal: parsed.goal,
    autopilotId: parsed.autopilotId,
    roundIndex,
    phase,
    commands: [
      `tools\\bridge.cmd premium plan "${parsed.goal}"`,
      `tools\\bridge.cmd visual critique "${parsed.goal}"`,
      `tools\\bridge.cmd qa launch "${parsed.goal}"`,
      `tools\\bridge.cmd autopilot score "${parsed.goal}"`,
    ],
    expectedEvidence: ['plugin health', 'visual critique', 'QA launch readiness', 'premium score', 'output baseline'],
    allowedMutations: policy.maxMutationsPerRound > 0 ? ['Workspace.Codex*', 'ReplicatedStorage.Codex*', 'StarterGui.Codex*'] : [],
    blockedActions: policy.blockedActions,
    rollbackPlan: createRollbackPlan(parsed.goal, roundIndex),
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd autopilot evidence "${parsed.goal}"`,
  };
}

module.exports = { createRoundPlan };
