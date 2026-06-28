'use strict';

const { VERSION, nowIso } = require('./schema');
const { canMutate } = require('./safety-policy');

function mutationGate(run, toolName) {
  const mutating = ['execute_apply', 'execute_rollback', 'memory_learn'].includes(toolName);
  if (!mutating) return { ok: true, mutating, approved: true };
  const approved = canMutate(run);
  return {
    ok: approved,
    version: VERSION,
    at: nowIso(),
    mutating,
    approved,
    status: approved ? 'approved' : 'waitingApproval',
    reason: approved ? 'Mutation approval exists for this AI run.' : 'AI runs are plan-only until approved.',
    nextCommand: `tools\\bridge.cmd ai approve ${run.runId}`,
  };
}

function approveMutation(run) {
  return {
    ...run,
    status: run.status === 'planned' ? 'waitingApproval' : run.status,
    approvals: [
      ...(run.approvals || []),
      { type: 'mutation', status: 'approved', at: nowIso(), note: 'Approved local V72-gated mutation for this AI run.' },
    ],
    updatedAt: nowIso(),
    nextCommand: `tools\\bridge.cmd ai continue ${run.runId}`,
  };
}

module.exports = {
  approveMutation,
  mutationGate,
};
