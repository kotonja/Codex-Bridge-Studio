'use strict';

const { VERSION, nowIso, redact, resultSummary } = require('./schema');

function ensureTimeline(runtime = {}) {
  if (!Array.isArray(runtime.timeline)) runtime.timeline = [];
  return runtime.timeline;
}

function makeStepId(label = 'step') {
  const crypto = require('node:crypto');
  const suffix = crypto.createHash('sha1').update(`${label}:${Date.now()}:${Math.random()}`).digest('hex').slice(0, 8);
  return `step_${suffix}`;
}

function actionLabel(action = '') {
  return {
    memoryRecommend: 'Memory Recommend',
    referenceAnalyze: 'Reference Analyze',
    reconstructInfer: 'Reconstruction',
    worldcompileCompile: 'World Compile',
    worldcompilePackage: 'World Package',
    executePreview: 'Execution Preview',
    executeApply: 'Execution Apply',
    executeVerify: 'Execution Verify',
    executeRollback: 'Execution Rollback',
    visualCritique: 'Visual Critique',
    fidelityCompare: 'Fidelity Compare',
    dashboardFidelityCompare: 'Fidelity Compare',
    dashboardFidelityFixPlan: 'Fidelity Fix Plan',
    dashboardFidelityPreview: 'Fidelity Fix Preview',
    dashboardFidelityApply: 'Fidelity Fix Apply',
    dashboardFidelityRecompare: 'Fidelity Recompare',
    dashboardFidelityQa: 'Fidelity QA',
    dashboardFidelityLearn: 'Fidelity Learn',
    dashboardFidelityRollback: 'Fidelity Rollback',
    qaLaunch: 'QA Launch',
    autopilotReport: 'Autopilot Report',
    memoryLearn: 'Memory Learn',
  }[action] || String(action || 'Dashboard Step');
}

function appendStep(runtime, step = {}) {
  const timeline = ensureTimeline(runtime);
  const clean = redact({
    stepId: step.stepId || makeStepId(step.label || step.action || 'step'),
    label: step.label || actionLabel(step.action),
    system: step.system || 'dashboard',
    status: step.status || 'planned',
    command: step.command || null,
    summary: step.summary || null,
    startedAt: step.startedAt || nowIso(),
    completedAt: step.completedAt || null,
    resultPreview: step.resultPreview ? resultSummary(step.resultPreview) : null,
    warnings: Array.isArray(step.warnings) ? step.warnings.slice(0, 8) : [],
    blockers: Array.isArray(step.blockers) ? step.blockers.slice(0, 8) : [],
  });
  timeline.push(clean);
  if (timeline.length > 160) timeline.splice(0, timeline.length - 160);
  return clean;
}

function updateStep(runtime, stepId, patch = {}) {
  const timeline = ensureTimeline(runtime);
  const step = timeline.find((item) => item.stepId === stepId);
  if (!step) return null;
  const clean = { ...patch };
  if (Object.prototype.hasOwnProperty.call(clean, 'resultPreview')) {
    clean.resultPreview = resultSummary(clean.resultPreview);
  }
  Object.assign(step, redact(clean));
  if (patch.status && !step.completedAt && ['complete', 'failed', 'blocked', 'manualRequired'].includes(patch.status)) {
    step.completedAt = nowIso();
  }
  return step;
}

function recordAction(runtime, action, result, goal) {
  const clean = redact(result || {});
  return appendStep(runtime, {
    label: actionLabel(action),
    system: 'dashboardAction',
    status: clean.ok === false ? (clean.status || 'failed') : 'complete',
    command: action,
    summary: `${actionLabel(action)}${goal ? ` for ${goal}` : ''}`,
    completedAt: nowIso(),
    resultPreview: clean.result || clean,
    warnings: clean.warnings,
    blockers: clean.blockers,
  });
}

function listTimeline(runtime = {}, limit = 80) {
  const timeline = ensureTimeline(runtime);
  const capped = timeline.slice(Math.max(0, timeline.length - Number(limit || 80)));
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    count: timeline.length,
    timeline: capped,
    warnings: [],
    blockers: [],
    nextCommand: 'tools\\bridge.cmd dashboard runs',
  };
}

module.exports = {
  actionLabel,
  appendStep,
  ensureTimeline,
  listTimeline,
  recordAction,
  updateStep,
};
