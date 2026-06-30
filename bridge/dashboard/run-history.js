'use strict';

const crypto = require('node:crypto');
const { VERSION, nowIso, redact, safeGoal, resultSummary } = require('./schema');
const Execution = require('../execution');

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

function currentTransactionStatus(transactionId) {
  if (!transactionId) return null;
  try {
    const list = Execution.transactionList(200);
    const tx = Array.isArray(list.transactions)
      ? list.transactions.find((item) => item.transactionId === transactionId)
      : null;
    return tx ? tx.status || null : null;
  } catch (_error) {
    return null;
  }
}

function reconcileRunForDisplay(runtime = {}, run = {}) {
  const approvals = Array.isArray(runtime.approvals) ? runtime.approvals : [];
  const approvalId = (Array.isArray(run.approvals) && run.approvals[0] && run.approvals[0].approvalId)
    || (run.resultSummary && run.resultSummary.transactionId)
    || null;
  const currentApproval = approvalId ? approvals.find((item) => item.approvalId === approvalId) : null;
  const transactionStatus = currentTransactionStatus(approvalId);
  const approvalStatus = currentApproval ? currentApproval.status || 'pending' : (approvalId ? 'unknown' : null);
  let status = run.status;
  let completedAt = run.completedAt;
  let nextCommand = run.nextCommand;

  if (run.status === 'waitingApproval') {
    if (transactionStatus === 'rolledBack') {
      status = 'rolledBack';
      nextCommand = `tools\\bridge.cmd execute verify ${approvalId}`;
    } else if (approvalStatus === 'approved') {
      status = 'applied';
      nextCommand = `tools\\bridge.cmd execute verify ${approvalId}`;
    } else if (approvalStatus === 'rejected') {
      status = 'rejected';
      nextCommand = 'tools\\bridge.cmd dashboard approvals';
    } else if (approvalStatus === 'failed') {
      status = 'failed';
      nextCommand = 'tools\\bridge.cmd dashboard approvals';
    }
    if (status !== 'waitingApproval') {
      completedAt = completedAt || (currentApproval && currentApproval.updatedAt) || run.startedAt || nowIso();
    }
  }

  return { status, completedAt, nextCommand, approvalStatus, transactionStatus };
}

function listRuns(runtime = {}, limit = 25) {
  const runs = ensureRuns(runtime);
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    count: runs.length,
    runs: runs.slice(0, Number(limit || 25)).map((run) => {
      const display = reconcileRunForDisplay(runtime, run);
      return redact({
        runId: run.runId,
        kind: run.kind,
        goal: run.goal,
        routeCategory: run.routeCategory,
        status: display.status,
        startedAt: run.startedAt,
        completedAt: display.completedAt,
        stepCount: Array.isArray(run.steps) ? run.steps.length : 0,
        approvalCount: Array.isArray(run.approvals) ? run.approvals.length : 0,
        approvalStatus: display.approvalStatus,
        transactionStatus: display.transactionStatus,
        resultSummary: run.resultSummary,
        warnings: run.warnings,
        blockers: run.blockers,
        nextCommand: display.nextCommand,
      });
    }),
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
  reconcileRunForDisplay,
  updateRun,
};
