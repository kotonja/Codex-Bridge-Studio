'use strict';

const { VERSION, DASHBOARD_URL, nowIso, redact } = require('./schema');
const { dashboardHtml } = require('./html');
const { readDashboardAsset } = require('./assets');
const { createDashboardStatus } = require('./status');
const { createDashboardState } = require('./state');
const { createTransactionView } = require('./transaction-view');
const { createReportView } = require('./report-view');
const { createRuntimeState, runDashboardCommand, runProductionRequest } = require('./run-controller');
const { approveDashboardRun, cancelDashboardRun } = require('./approval-controller');
const Chat = require('./chat');
const ChatHistory = require('./chat-history');
const Timeline = require('./timeline');
const RunHistory = require('./run-history');
const ApprovalQueue = require('./approval-queue');
const PipelineRunner = require('./pipeline-runner');
const PipelinePresets = require('./pipeline-presets');
const CostView = require('./cost-view');
const SafetyReport = require('./safety-report');

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

async function chat(body = {}, env = {}) {
  return Chat.runDashboardChat(runtime, body, env);
}

function chatHistory(body = {}) {
  return ChatHistory.listHistory(runtime, body.limit || 60);
}

function clearChat() {
  return ChatHistory.clearHistory(runtime);
}

function timeline(body = {}) {
  return Timeline.listTimeline(runtime, body.limit || 80);
}

function runs(body = {}) {
  return RunHistory.listRuns(runtime, body.limit || 25);
}

function runDetail(runId) {
  return RunHistory.getRun(runtime, runId);
}

function approvals(body = {}) {
  return ApprovalQueue.listApprovals(runtime, body.status || 'pending');
}

async function approve(body = {}, env = {}) {
  return approveDashboardRun(runtime, body, env);
}

function cancel(body = {}) {
  return cancelDashboardRun(runtime, body);
}

async function approveApproval(body = {}, env = {}) {
  const approvalId = body.approvalId || body.id;
  return approveDashboardRun(runtime, { approvalId }, env);
}

function rejectApproval(body = {}) {
  const approvalId = body.approvalId || body.id;
  if (runtime.pendingApproval && runtime.pendingApproval.approvalId === approvalId) {
    return cancelDashboardRun(runtime, { reason: body.reason || 'dashboardApprovalRejected' });
  }
  return ApprovalQueue.markApproval(runtime, approvalId, 'rejected', body.reason || 'dashboardApprovalRejected');
}

function cost() {
  return CostView.createCostView(runtime);
}

async function pipeline(body = {}, env = {}) {
  return PipelineRunner.runPipeline(runtime, body, env);
}

function presets() {
  return PipelinePresets.listPresets();
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

function safety() {
  return SafetyReport.createDashboardSafetyReport(runtime);
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
  chat,
  chatHistory,
  clearChat,
  timeline,
  runs,
  runDetail,
  approvals,
  approve,
  cancel,
  approveApproval,
  rejectApproval,
  cost,
  pipeline,
  presets,
  rollback,
  reference,
  transactions,
  report,
  safety,
  selfCheck,
  redact,
};
