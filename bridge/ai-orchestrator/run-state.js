'use strict';

const { DEFAULT_MODEL, VERSION, nowIso, runId } = require('./schema');

function createRunState(goal, options = {}) {
  const id = options.runId || runId(goal);
  return {
    version: VERSION,
    runId: id,
    goal,
    status: options.status || 'planned',
    model: options.model || DEFAULT_MODEL,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    steps: [],
    toolCalls: [],
    approvals: [],
    costEstimate: {},
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd ai continue ${id}`,
  };
}

function updateRun(run, patch = {}) {
  return {
    ...run,
    ...patch,
    updatedAt: nowIso(),
  };
}

module.exports = {
  createRunState,
  updateRun,
};
