'use strict';

const { VERSION, nowIso, redact, resultSummary, safeGoal } = require('./schema');
const { runAllowedAction } = require('./command-runner');

function createRuntimeState() {
  return {
    latest: {
      goal: '',
      lastCommand: null,
      lastResult: null,
      transactions: [],
      warnings: [],
      blockers: [],
      timeline: {},
    },
    pendingApproval: null,
    references: [],
    audit: [],
  };
}

function remember(runtime, action, result, goal) {
  const clean = redact(result);
  runtime.latest.goal = goal || runtime.latest.goal;
  runtime.latest.lastCommand = action;
  runtime.latest.lastResult = resultSummary(clean);
  runtime.latest.warnings = Array.isArray(clean.warnings) ? clean.warnings : [];
  runtime.latest.blockers = Array.isArray(clean.blockers) ? clean.blockers : [];
  runtime.latest.nextCommand = clean.nextCommand;
  const key = {
    referenceAnalyze: 'Reference',
    reconstructInfer: 'Reconstruction',
    worldcompileCompile: 'Worldcompile',
    worldcompilePackage: 'Worldcompile',
    executePreview: 'Execute Preview',
    executeApply: 'Execute Apply',
    executeVerify: 'Verify',
    visualCritique: 'Visual',
    fidelityCompare: 'Fidelity',
    qaLaunch: 'QA',
    autopilotReport: 'Autopilot',
    memoryLearn: 'Memory Learn',
    memoryRecommend: 'Memory',
  }[action];
  if (key) runtime.latest.timeline[key] = clean.ok === false ? 'blocked' : 'complete';
  if (action === 'visualCritique') runtime.latest.visualCritique = clean.result || clean;
  if (action === 'fidelityCompare') runtime.latest.fidelityCompare = clean.result || clean;
  if (action === 'qaLaunch') runtime.latest.qaLaunch = clean.result || clean;
  if (action === 'autopilotReport') runtime.latest.autopilotReport = clean.result || clean;
  if (clean.result && clean.result.transactionId) runtime.latest.transactions.unshift(clean.result);
  runtime.audit.unshift({ at: nowIso(), action, goal, status: clean.status || (clean.ok === false ? 'failed' : 'ok'), summary: resultSummary(clean.result || clean) });
  runtime.audit = runtime.audit.slice(0, 80);
  return clean;
}

async function runDashboardCommand(runtime, body = {}, options = {}) {
  const action = String(body.action || body.command || '').trim();
  const args = body.args && typeof body.args === 'object' ? body.args : body;
  const goal = safeGoal(args.goal || args.intent || args.text || args.query || args.source || args.path);
  const result = await runAllowedAction(action, args, options);
  const remembered = remember(runtime, action, result, goal);
  if (action === 'executePreview' && result.ok !== false && result.result && result.result.transactionId) {
    runtime.pendingApproval = {
      approvalId: result.result.transactionId,
      action: 'executeApply',
      goal,
      safetyClass: 'codexOwnedExecutionKernelApply',
      previewSummary: {
        transactionId: result.result.transactionId,
        rootsToCreate: Array.isArray(result.result.rootsToCreate) ? result.result.rootsToCreate.length : undefined,
        actions: Array.isArray(result.result.actions) ? result.result.actions.length : undefined,
        manualRequiredActions: Array.isArray(result.result.manualRequiredActions) ? result.result.manualRequiredActions.length : undefined,
      },
      createdAt: nowIso(),
      nextCommand: 'Click Approve in the dashboard or POST /dashboard/approve.',
    };
    runtime.latest.timeline['Execute Apply'] = 'pendingApproval';
  }
  return remembered;
}

async function runProductionRequest(runtime, body = {}, options = {}) {
  const goal = safeGoal(body.goal || body.intent || body.text || body.query || 'premium Roblox production goal');
  const steps = [
    ['memoryRecommend', { goal }],
    ['referenceAnalyze', { source: body.source || body.path || goal, goal }],
    ['reconstructInfer', { goal }],
    ['worldcompilePackage', { goal }],
    ['executePreview', { goal }],
    ['visualCritique', { goal }],
    ['fidelityCompare', { goal }],
    ['qaLaunch', { goal }],
    ['autopilotReport', { goal }],
  ];
  const timeline = [];
  for (const [action, args] of steps) {
    const result = await runDashboardCommand(runtime, { action, args }, options);
    timeline.push({ action, status: result.status || (result.ok === false ? 'failed' : 'ok'), summary: result.resultSummary || resultSummary(result.result) });
  }
  return redact({
    ok: true,
    version: VERSION,
    at: nowIso(),
    mode: 'dashboardProductionRun',
    goal,
    timeline,
    pendingApproval: runtime.pendingApproval,
    warnings: runtime.latest.warnings || [],
    blockers: runtime.latest.blockers || [],
    nextCommand: runtime.pendingApproval ? 'Review dashboard preview, then approve Execute Apply.' : 'tools\\bridge.cmd dashboard report',
  });
}

module.exports = { createRuntimeState, remember, runDashboardCommand, runProductionRequest };
