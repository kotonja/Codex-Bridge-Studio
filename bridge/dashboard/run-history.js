'use strict';

const crypto = require('node:crypto');
const { VERSION, nowIso, redact, safeGoal, resultSummary } = require('./schema');

function ensureRuns(runtime = {}) {
  if (!Array.isArray(runtime.runs)) runtime.runs = [];
  return runtime.runs;
}

function makeRunId(goal = 'dashboard-run') {
  const hash = crypto.createHash('sha1').update(`${goal}:${Date.now()}:${Math.random()}`).digest('hex').slice(0, 12);
  return `dash_${hash}`;
}

function createRun(runtime, input = {}) {
  const runs = ensureRuns(runtime);
  const run = redact({
    runId: input.runId || makeRunId(input.goal || input.message || 'dashboard-run'),
    kind: input.kind || 'dashboard',
    goal: safeGoal(input.goal || input.message || 'dashboard goal'),
    routeCategory: input.routeCategory || (input.route && input.route.category) || null,
    route: input.route || null,
    status: input.status || 'planned',
    startedAt: nowIso(),
    completedAt: null,
    steps: Array.isArray(input.steps) ? input.steps : [],
    approvals: Array.isArray(input.approvals) ? input.approvals : [],
    resultSummary: input.resultSummary || null,
    warnings: Array.isArray(input.warnings) ? input.warnings : [],
    blockers: Array.isArray(input.blockers) ? input.blockers : [],
    nextCommand: input.nextCommand || 'tools\\bridge.cmd dashboard timeline',
  });
  runs.unshift(run);
  if (runs.length > 80) runs.splice(80);
  return run;
}

function updateRun(runtime, runId, patch = {}) {
  const runs = ensureRuns(runtime);
  const run = runs.find((item) => item.runId === runId);
  if (!run) return null;
  Object.assign(run, redact(patch));
  if (patch.result && !patch.resultSummary) run.resultSummary = resultSummary(patch.result);
  if (patch.status && ['complete', 'failed', 'blocked', 'manualRequired'].includes(patch.status)) run.completedAt = patch.completedAt || nowIso();
  return run;
}

function listRuns(runtime = {}, limit = 25) {
  const runs = ensureRuns(runtime);
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    count: runs.length,
    runs: runs.slice(0, Number(limit || 25)).map((run) => redact({
      runId: run.runId,
      kind: run.kind,
      goal: run.goal,
      routeCategory: run.routeCategory,
      status: run.status,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
      stepCount: Array.isArray(run.steps) ? run.steps.length : 0,
      approvalCount: Array.isArray(run.approvals) ? run.approvals.length : 0,
      resultSummary: run.resultSummary,
      warnings: run.warnings,
      blockers: run.blockers,
      nextCommand: run.nextCommand,
    })),
    warnings: [],
    blockers: [],
    nextCommand: 'tools\\bridge.cmd dashboard timeline',
  };
}

function getRun(runtime = {}, runId) {
  const run = ensureRuns(runtime).find((item) => item.runId === runId);
  if (!run) {
    return {
      ok: false,
      version: VERSION,
      status: 'notFound',
      runId,
      warnings: [],
      blockers: [`No dashboard run found for ${runId}.`],
      nextCommand: 'tools\\bridge.cmd dashboard runs',
    };
  }
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    run: redact(run),
    warnings: [],
    blockers: [],
    nextCommand: 'tools\\bridge.cmd dashboard timeline',
  };
}

module.exports = {
  createRun,
  ensureRuns,
  getRun,
  listRuns,
  updateRun,
};
