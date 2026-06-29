'use strict';

const { VERSION, DASHBOARD_URL, nowIso, redact } = require('./schema');
const { dashboardHtml } = require('./html');
const { readDashboardAsset } = require('./assets');
const { createDashboardStatus } = require('./status');
const { createDashboardState } = require('./state');
const { createTransactionView } = require('./transaction-view');
const { createReportView } = require('./report-view');
const { createSafetyView } = require('./safety-view');
const { createRuntimeState, runDashboardCommand, runProductionRequest } = require('./run-controller');
const { approveDashboardRun, cancelDashboardRun } = require('./approval-controller');

const runtime = createRuntimeState();

function getRuntime() {
  return runtime;
}

function getHtml() {
  return dashboardHtml();
}

function getAsset(name) {
  return readDashboardAsset(name);
}

function getStatus(env = {}) {
  return createDashboardStatus(env);
}

function getState(env = {}) {
  return createDashboardState(env, runtime);
}

async function command(body = {}, env = {}) {
  return runDashboardCommand(runtime, body, env);
}

async function run(body = {}, env = {}) {
  return runProductionRequest(runtime, body, env);
}

async function approve(body = {}, env = {}) {
  return approveDashboardRun(runtime, body, env);
}

function cancel(body = {}) {
  return cancelDashboardRun(runtime, body);
}

async function rollback(body = {}, env = {}) {
  const transactionId = body.transactionId || body.tx || (body.args && (body.args.transactionId || body.args.tx));
  if (!transactionId) {
    return {
      ok: false,
      version: VERSION,
      status: 'manualRequired',
      warnings: [],
      blockers: ['Rollback requires a transactionId.'],
      nextCommand: 'tools\\bridge.cmd execute transactions',
    };
  }
  return command({ action: 'executeRollback', transactionId }, env);
}

async function reference(body = {}, env = {}) {
  const source = body.source || body.path || body.imagePath || body.note || body.goal || body.text || '';
  runtime.references.unshift({
    at: nowIso(),
    source,
    kind: body.imagePath || body.path ? 'pathOrImage' : 'note',
    rawImageBytesStored: false,
  });
  runtime.references = runtime.references.slice(0, 25);
  return command({ action: 'referenceAnalyze', source, goal: body.goal || source }, env);
}

function transactions(limit = 12, options = {}) {
  const view = createTransactionView(limit, options);
  runtime.latest.transactions = view.transactions;
  return view;
}

function report() {
  return createReportView(runtime);
}

function selfCheck() {
  const { runSelfCheck } = require('./self-check');
  return runSelfCheck();
}

module.exports = {
  VERSION,
  DASHBOARD_URL,
  getRuntime,
  getHtml,
  getAsset,
  getStatus,
  getState,
  command,
  run,
  approve,
  cancel,
  rollback,
  reference,
  transactions,
  report,
  safety: createSafetyView,
  selfCheck,
  redact,
};
