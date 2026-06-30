'use strict';

const { VERSION, nowIso, redact, resultSummary, safeGoal } = require('./schema');
const { getPreset } = require('./pipeline-presets');
const { runDashboardCommand } = require('./run-controller');
const Timeline = require('./timeline');
const RunHistory = require('./run-history');
const ApprovalQueue = require('./approval-queue');
const ImagePipeline = require('./image-pipeline');

function stepForAction(action, goal) {
  if (action === 'approvalGate') {
    return {
      label: 'Approval Gate',
      system: 'dashboardApproval',
      status: 'manualRequired',
      command: 'tools\\bridge.cmd dashboard approvals',
      summary: 'Review execution preview and approve before Execute Apply.',
      warnings: ['Apply is intentionally stopped until explicit dashboard approval.'],
      blockers: [],
    };
  }
  return {
    label: Timeline.actionLabel(action),
    system: 'dashboardPipeline',
    status: 'planned',
    command: `dashboard:${action}`,
    summary: `${Timeline.actionLabel(action)} for ${goal}`,
    warnings: [],
    blockers: [],
  };
}

function createPipelinePlan(goal, presetId) {
  const preset = getPreset(presetId || goal);
  const safe = safeGoal(goal);
  const steps = preset.actions.map((action) => stepForAction(action, safe));
  return redact({
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: safe,
    preset,
    mode: preset.mode,
    planOnly: true,
    steps,
    approvalRequired: preset.actions.includes('approvalGate') || preset.actions.includes('executeApply'),
    warnings: preset.mode === 'approvalRequired' ? ['Execute Apply is only available after explicit dashboard approval.'] : [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd dashboard pipeline "${safe}"`,
  });
}

function resolveImageInput(body = {}, goal = '') {
  const input = body.referenceId || body.id || body.imagePath || body.path || body.source || goal;
  if (!input) return null;
  try {
    const resolved = ImagePipeline.resolveInput(input, { source: 'dashboard.pipeline.resolve' });
    return resolved && resolved.ok ? resolved : null;
  } catch (_error) {
    return null;
  }
}

function imageAwarePreset(preset, imageInput) {
  if (!imageInput) return preset;
  if (preset.id === 'referenceToWorldPreview' || preset.id === 'imageToWorldPreview') {
    return getPreset('imageToWorldPreview');
  }
  return preset;
}

function argsForAction(action, body, goal, currentGoal, imageInput) {
  const args = { goal: currentGoal, source: body.source || body.path || currentGoal };
  if (imageInput && (action === 'dashboardImageAnalyze' || action === 'dashboardImageWorldcompile')) {
    args.referenceId = imageInput.referenceId;
    args.source = imageInput.referenceId;
    args.goal = imageInput.referenceId;
  }
  return args;
}

function nextGoalFromResult(action, wrapper, fallbackGoal) {
  const result = wrapper && wrapper.result ? wrapper.result : wrapper;
  if (action === 'dashboardImageWorldcompile') {
    return (result.worldcompile && result.worldcompile.goal)
      || (result.package && result.package.goal)
      || (result.executePreview && result.executePreview.goal)
      || result.goal
      || fallbackGoal;
  }
  return fallbackGoal;
}

async function runPipeline(runtime, body = {}, env = {}) {
  const goal = safeGoal(body.goal || body.intent || body.message || body.text || body.query || 'premium Roblox production goal');
  const imageInput = resolveImageInput(body, goal);
  const preset = imageAwarePreset(getPreset(body.preset || body.presetId || goal), imageInput);
  const plan = createPipelinePlan(goal, preset.id);
  if (body.planOnly === true || body.mode === 'plan') return plan;

  const run = RunHistory.createRun(runtime, {
    kind: 'dashboardPipeline',
    goal,
    routeCategory: 'dashboard',
    status: 'running',
    nextCommand: 'tools\\bridge.cmd dashboard approvals',
  });
  const results = [];
  let currentGoal = imageInput ? imageInput.referenceId : goal;
  let actualVisionUsed = false;
  const executable = preset.actions.filter((action) => action !== 'approvalGate' && action !== 'executeApply' && action !== 'executeVerify');
  for (const action of executable) {
    const step = Timeline.appendStep(runtime, {
      label: Timeline.actionLabel(action),
      system: 'dashboardPipeline',
      status: 'running',
      command: action,
      summary: `${Timeline.actionLabel(action)} for ${currentGoal}`,
    });
    const result = await runDashboardCommand(runtime, { action, args: argsForAction(action, body, goal, currentGoal, imageInput) }, env);
    Timeline.updateStep(runtime, step.stepId, {
      status: result.ok === false ? (result.status || 'failed') : 'complete',
      completedAt: nowIso(),
      resultPreview: result.result || result,
      warnings: result.warnings,
      blockers: result.blockers,
    });
    actualVisionUsed = actualVisionUsed || Boolean(result.actualVisionUsed) || Boolean(result.result && result.result.actualVisionUsed);
    results.push({ action, status: result.status || (result.ok === false ? 'failed' : 'ok'), summary: resultSummary(result.result || result) });
    if (result.ok === false && result.status !== 'manualRequired') break;
    currentGoal = nextGoalFromResult(action, result, currentGoal);
  }

  if (runtime.pendingApproval) runtime.pendingApproval.runId = run.runId;
  const approval = ApprovalQueue.syncFromPending(runtime);
  const finalStatus = approval ? 'waitingApproval' : 'complete';
  RunHistory.updateRun(runtime, run.runId, {
    status: finalStatus,
    completedAt: finalStatus === 'complete' ? nowIso() : null,
    steps: results,
    approvals: approval ? [approval] : [],
    resultSummary: results[results.length - 1] ? results[results.length - 1].summary : null,
    nextCommand: approval ? approval.approveCommand : 'tools\\bridge.cmd dashboard timeline',
  });

  return redact({
    ok: true,
    version: VERSION,
    at: nowIso(),
    mode: 'dashboardPipelinePreview',
    runId: run.runId,
    goal,
    imageReferenceId: imageInput ? imageInput.referenceId : null,
    actualVisionUsed,
    executionGoal: currentGoal,
    preset,
    steps: results,
    pendingApproval: runtime.pendingApproval || null,
    approvals: approval ? [approval] : [],
    warnings: approval ? ['Pipeline stopped at approval gate; no Studio apply happened yet.'] : [],
    blockers: [],
    nextCommand: approval ? approval.approveCommand : 'tools\\bridge.cmd dashboard report',
  });
}

module.exports = {
  createPipelinePlan,
  runPipeline,
};
