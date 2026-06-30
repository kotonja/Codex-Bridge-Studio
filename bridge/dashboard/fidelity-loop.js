'use strict';

const crypto = require('node:crypto');
const Fidelity = require('../fidelity');
const QaSwarm = require('../qa-swarm');
const Visual = require('../visual');
const Premium = require('../premium');
const Autopilot = require('../autopilot');
const { VERSION, nowIso, redact, resultSummary, safeGoal } = require('./schema');
const { previewFidelityFixes } = require('./fidelity-fix-preview');
const { computeScoreDelta, scoreFrom } = require('./fidelity-score-delta');
const { createFidelityState, getLatestLoop, upsertLoop } = require('./fidelity-state');
const { learnFidelityLoop } = require('./fidelity-memory');
const { runAllowedAction } = require('./command-runner');
const Timeline = require('./timeline');
const ApprovalQueue = require('./approval-queue');

function loopIdFor(goal) {
  const hash = crypto.createHash('sha1').update(`${safeGoal(goal)}:${Date.now()}:${Math.random()}`).digest('hex').slice(0, 12);
  return `dash_fidelity_${hash}`;
}

function goalFrom(body = {}, fallback = 'dark purple anime dungeon gate') {
  return safeGoal(body.goal || body.reference || body.source || body.path || body.referenceId || body.text || body.intent || body.query || fallback);
}

function loopFromBody(runtime, body = {}) {
  const storeLoop = body.loopId ? (runtime.fidelityLoop && runtime.fidelityLoop.loops || []).find((loop) => loop.loopId === body.loopId) : null;
  return storeLoop || getLatestLoop(runtime) || null;
}

async function compare(runtime, body = {}, env = {}) {
  const goal = goalFrom(body);
  const report = await Fidelity.compare(goal, { source: 'dashboard.fidelityLoop.compare' });
  const baselineScore = scoreFrom(report);
  const loop = upsertLoop(runtime, {
    loopId: body.loopId || loopIdFor(goal),
    goal: report.goal || goal,
    status: 'compared',
    mode: report.mode,
    actualReferenceVisionUsed: report.actualReferenceVisionUsed === true,
    actualStudioPixelsUsed: report.actualStudioPixelsUsed === true,
    limitedComparison: report.limitedComparison !== false,
    baselineScore,
    afterScore: null,
    scoreDelta: null,
    baselineReport: report,
    mismatches: report.mismatches || [],
    intentionalAdaptations: report.intentionalAdaptations || [],
    manualRequired: report.unsafeOrManualRequiredFixes || [],
    safeFixPlan: report.safeFixPlan,
    warnings: report.warnings || [],
    blockers: report.blockers || [],
    createdAt: nowIso(),
    nextCommand: `tools\\bridge.cmd dashboard fidelity-fix-plan "${report.goal || goal}"`,
  });
  Timeline.recordAction(runtime, 'dashboardFidelityCompare', { ok: true, result: loop, warnings: loop.warnings, blockers: loop.blockers }, loop.goal);
  return redact({
    ok: true,
    version: VERSION,
    at: nowIso(),
    mode: 'dashboardFidelityCompare',
    loopId: loop.loopId,
    goal: loop.goal,
    baselineScore,
    actualReferenceVisionUsed: loop.actualReferenceVisionUsed,
    actualStudioPixelsUsed: loop.actualStudioPixelsUsed,
    limitedComparison: loop.limitedComparison,
    mismatches: loop.mismatches,
    intentionalAdaptations: loop.intentionalAdaptations,
    manualRequired: loop.manualRequired,
    report,
    warnings: loop.warnings,
    blockers: loop.blockers,
    nextCommand: loop.nextCommand,
  });
}

async function fixPlan(runtime, body = {}, env = {}) {
  let loop = loopFromBody(runtime, body);
  if (!loop || body.forceCompare === true) {
    const compared = await compare(runtime, body, env);
    loop = loopFromBody(runtime, { loopId: compared.loopId });
  }
  const goal = goalFrom(body, loop.goal);
  const report = await Fidelity.fixPlan(goal, { source: 'dashboard.fidelityLoop.fixPlan' });
  const stages = report.safeFixPlan && Array.isArray(report.safeFixPlan.stages) ? report.safeFixPlan.stages : [];
  const manualRequired = [
    ...(loop.manualRequired || []),
    ...(report.unsafeOrManualRequiredFixes || []),
  ];
  loop = upsertLoop(runtime, {
    ...loop,
    goal: report.goal || loop.goal || goal,
    status: 'fixPlanReady',
    fixPlanReport: report,
    safeFixPlan: report.safeFixPlan,
    safeFixes: stages,
    manualRequired,
    warnings: report.warnings || loop.warnings || [],
    blockers: report.blockers || [],
    nextCommand: `tools\\bridge.cmd dashboard fidelity-preview "${report.goal || goal}"`,
  });
  Timeline.recordAction(runtime, 'dashboardFidelityFixPlan', { ok: true, result: loop, warnings: loop.warnings, blockers: loop.blockers }, loop.goal);
  return redact({
    ok: true,
    version: VERSION,
    at: nowIso(),
    mode: 'dashboardFidelityFixPlan',
    loopId: loop.loopId,
    goal: loop.goal,
    safeFixPlan: loop.safeFixPlan,
    safeFixes: loop.safeFixes,
    manualRequired: loop.manualRequired,
    warnings: loop.warnings,
    blockers: loop.blockers,
    nextCommand: loop.nextCommand,
  });
}

async function preview(runtime, body = {}, env = {}) {
  let loop = loopFromBody(runtime, body);
  if (!loop || !loop.safeFixPlan) {
    const planned = await fixPlan(runtime, body, env);
    loop = loopFromBody(runtime, { loopId: planned.loopId });
  }
  const previewReport = previewFidelityFixes(loop.goal, loop.baselineReport || {}, loop.fixPlanReport || loop.safeFixPlan || {});
  loop = upsertLoop(runtime, {
    ...loop,
    status: previewReport.ok === false ? (previewReport.status || 'manualRequired') : 'waitingApproval',
    preview: previewReport,
    safeFixes: previewReport.safeFixes || loop.safeFixes || [],
    manualRequired: previewReport.manualRequired || loop.manualRequired || [],
    approvalId: previewReport.transactionId || null,
    transactionId: previewReport.transactionId || null,
    executionGoal: previewReport.executionGoal,
    warnings: previewReport.warnings || [],
    blockers: previewReport.blockers || [],
    nextCommand: previewReport.nextCommand,
  });
  if (previewReport.ok !== false && previewReport.transactionId) {
    runtime.pendingApproval = {
      approvalId: previewReport.transactionId,
      action: 'executeApply',
      goal: previewReport.executionGoal,
      runId: loop.loopId,
      safetyClass: 'codexOwnedExecutionKernelApply',
      previewSummary: {
        transactionId: previewReport.transactionId,
        fidelityLoopId: loop.loopId,
        safeFixes: loop.safeFixes.length,
        manualRequired: loop.manualRequired.length,
        rootsToCreate: previewReport.preview && Array.isArray(previewReport.preview.rootsToCreate) ? previewReport.preview.rootsToCreate.length : undefined,
        actions: previewReport.preview && Array.isArray(previewReport.preview.actions) ? previewReport.preview.actions.length : undefined,
      },
      risks: [],
      createdAt: nowIso(),
      nextCommand: `tools\\bridge.cmd dashboard fidelity-apply ${previewReport.transactionId}`,
    };
    ApprovalQueue.upsertApproval(runtime, runtime.pendingApproval);
  }
  Timeline.recordAction(runtime, 'dashboardFidelityPreview', { ok: previewReport.ok !== false, result: loop, warnings: loop.warnings, blockers: loop.blockers }, loop.goal);
  return redact({
    ok: previewReport.ok !== false,
    version: VERSION,
    at: nowIso(),
    mode: 'dashboardFidelityPreview',
    loopId: loop.loopId,
    goal: loop.goal,
    approvalId: loop.approvalId,
    transactionId: loop.transactionId,
    pendingApproval: runtime.pendingApproval || null,
    preview: previewReport,
    warnings: loop.warnings,
    blockers: loop.blockers,
    nextCommand: loop.nextCommand,
  });
}

async function apply(runtime, body = {}, env = {}) {
  let approvalId = body.approvalId || body.id || body.transactionId || body.tx;
  let loop = loopFromBody(runtime, body);
  if (!approvalId && loop) approvalId = loop.approvalId || loop.transactionId;
  if (!approvalId) {
    return {
      ok: false,
      version: VERSION,
      status: 'manualRequired',
      warnings: [],
      blockers: ['Dashboard fidelity apply requires an approvalId from fidelity-preview.'],
      nextCommand: 'tools\\bridge.cmd dashboard fidelity-preview "<reference-or-goal>"',
    };
  }
  const approval = (runtime.approvals || []).find((item) => item.approvalId === approvalId);
  const pending = runtime.pendingApproval && runtime.pendingApproval.approvalId === approvalId ? runtime.pendingApproval : approval;
  if (!pending || pending.status === 'rejected') {
    return {
      ok: false,
      version: VERSION,
      status: 'manualRequired',
      approvalId,
      warnings: [],
      blockers: [`No pending dashboard fidelity approval found for ${approvalId}.`],
      nextCommand: 'tools\\bridge.cmd dashboard approvals',
    };
  }
  const result = await runAllowedAction('executeApply', {
    goal: pending.goal,
    approvalId,
    transactionId: approvalId,
    system: 'Autopilot',
  }, { ...env, approved: true });
  ApprovalQueue.markApproval(runtime, approvalId, result.ok === false ? 'failed' : 'approved', 'dashboardFidelityApply');
  if (runtime.pendingApproval && runtime.pendingApproval.approvalId === approvalId) runtime.pendingApproval = null;
  loop = upsertLoop(runtime, {
    ...(loop || {}),
    loopId: loop ? loop.loopId : `dash_fidelity_${approvalId}`,
    goal: (loop && loop.goal) || pending.goal,
    status: result.ok === false ? (result.status || 'failed') : 'applied',
    applyResult: result,
    transactionId: result.result && result.result.transactionId ? result.result.transactionId : approvalId,
    approvalId,
    warnings: result.warnings || [],
    blockers: result.blockers || [],
    nextCommand: result.result && result.result.transactionId
      ? `tools\\bridge.cmd dashboard fidelity-recompare "${(loop && loop.goal) || pending.goal}"`
      : 'tools\\bridge.cmd dashboard approvals',
  });
  Timeline.recordAction(runtime, 'dashboardFidelityApply', { ok: result.ok !== false, result: loop, warnings: loop.warnings, blockers: loop.blockers }, loop.goal);
  return redact({
    ok: result.ok !== false,
    version: VERSION,
    at: nowIso(),
    mode: 'dashboardFidelityApply',
    loopId: loop.loopId,
    approvalId,
    transactionId: loop.transactionId,
    result,
    warnings: loop.warnings,
    blockers: loop.blockers,
    nextCommand: loop.nextCommand,
  });
}

async function recompare(runtime, body = {}, env = {}) {
  let loop = loopFromBody(runtime, body);
  if (!loop) {
    const compared = await compare(runtime, body, env);
    loop = loopFromBody(runtime, { loopId: compared.loopId });
  }
  const report = await Fidelity.compare(goalFrom(body, loop.goal), { source: 'dashboard.fidelityLoop.recompare' });
  const delta = computeScoreDelta(loop.baselineReport || { scores: { overall: loop.baselineScore } }, report);
  loop = upsertLoop(runtime, {
    ...loop,
    status: delta.status === 'unknown' ? 'recompared' : delta.status,
    afterReport: report,
    afterScore: delta.afterScore,
    scoreDelta: delta.scoreDelta,
    mode: report.mode,
    actualReferenceVisionUsed: report.actualReferenceVisionUsed === true,
    actualStudioPixelsUsed: report.actualStudioPixelsUsed === true,
    limitedComparison: report.limitedComparison !== false,
    warnings: report.warnings || [],
    blockers: report.blockers || [],
    nextCommand: `tools\\bridge.cmd dashboard fidelity-qa "${report.goal || loop.goal}"`,
  });
  Timeline.recordAction(runtime, 'dashboardFidelityRecompare', { ok: true, result: loop, warnings: loop.warnings, blockers: loop.blockers }, loop.goal);
  return redact({
    ok: true,
    version: VERSION,
    at: nowIso(),
    mode: 'dashboardFidelityRecompare',
    loopId: loop.loopId,
    goal: loop.goal,
    baselineScore: loop.baselineScore,
    afterScore: loop.afterScore,
    scoreDelta: loop.scoreDelta,
    status: loop.status,
    report,
    warnings: loop.warnings,
    blockers: loop.blockers,
    nextCommand: loop.nextCommand,
  });
}

async function qa(runtime, body = {}) {
  const loop = loopFromBody(runtime, body);
  const goal = goalFrom(body, loop && loop.goal);
  const report = QaSwarm.createLaunchReadinessReport(goal, { source: 'dashboard.fidelityLoop.qa' });
  const updated = upsertLoop(runtime, {
    ...(loop || {}),
    loopId: loop ? loop.loopId : loopIdFor(goal),
    goal,
    status: 'qaComplete',
    qaReport: report,
    qaScore: report.launchReadinessScore || report.score || null,
    warnings: report.warnings || [],
    blockers: report.blockers || [],
    nextCommand: `tools\\bridge.cmd dashboard fidelity-learn "${goal}"`,
  });
  Timeline.recordAction(runtime, 'dashboardFidelityQa', { ok: report.ok !== false, result: updated, warnings: updated.warnings, blockers: updated.blockers }, goal);
  return redact({
    ok: report.ok !== false,
    version: VERSION,
    at: nowIso(),
    mode: 'dashboardFidelityQa',
    loopId: updated.loopId,
    goal,
    qaScore: updated.qaScore,
    report,
    warnings: updated.warnings,
    blockers: updated.blockers,
    nextCommand: updated.nextCommand,
  });
}

async function learn(runtime, body = {}) {
  const loop = loopFromBody(runtime, body);
  const goal = goalFrom(body, loop && loop.goal);
  const result = learnFidelityLoop(goal, loop || {}, { source: 'dashboard.fidelityLoop.learn' });
  const updated = upsertLoop(runtime, {
    ...(loop || {}),
    loopId: loop ? loop.loopId : loopIdFor(goal),
    goal,
    status: result.ok === false ? 'learnFailed' : 'learned',
    memoryResult: result,
    warnings: result.warnings || [],
    blockers: result.blockers || [],
    nextCommand: `tools\\bridge.cmd memory recall "fidelity ${goal}"`,
  });
  Timeline.recordAction(runtime, 'dashboardFidelityLearn', { ok: result.ok !== false, result: updated, warnings: updated.warnings, blockers: updated.blockers }, goal);
  return redact({
    ok: result.ok !== false,
    version: VERSION,
    at: nowIso(),
    mode: 'dashboardFidelityLearn',
    loopId: updated.loopId,
    goal,
    memory: result,
    warnings: updated.warnings,
    blockers: updated.blockers,
    nextCommand: updated.nextCommand,
  });
}

async function rollback(runtime, body = {}, env = {}) {
  const loop = loopFromBody(runtime, body);
  const transactionId = body.transactionId || body.tx || body.id || (loop && loop.transactionId);
  if (!transactionId) {
    return {
      ok: false,
      version: VERSION,
      status: 'manualRequired',
      warnings: [],
      blockers: ['Dashboard fidelity rollback requires a transactionId.'],
      nextCommand: 'tools\\bridge.cmd execute transactions',
    };
  }
  const result = await runAllowedAction('executeRollback', { transactionId, tx: transactionId }, env);
  const updated = upsertLoop(runtime, {
    ...(loop || {}),
    loopId: loop ? loop.loopId : `dash_fidelity_${transactionId}`,
    status: result.ok === false ? (result.status || 'rollbackFailed') : 'rolledBack',
    rollbackStatus: result.status || (result.ok === false ? 'failed' : 'rolledBack'),
    rollbackResult: result,
    transactionId,
    warnings: result.warnings || [],
    blockers: result.blockers || [],
    nextCommand: `tools\\bridge.cmd execute verify ${transactionId}`,
  });
  Timeline.recordAction(runtime, 'dashboardFidelityRollback', { ok: result.ok !== false, result: updated, warnings: updated.warnings, blockers: updated.blockers }, updated.goal);
  return redact({
    ok: result.ok !== false,
    version: VERSION,
    at: nowIso(),
    mode: 'dashboardFidelityRollback',
    loopId: updated.loopId,
    transactionId,
    result,
    warnings: updated.warnings,
    blockers: updated.blockers,
    nextCommand: updated.nextCommand,
  });
}

async function loop(runtime, body = {}, env = {}) {
  const compared = await compare(runtime, body, env);
  const planned = await fixPlan(runtime, { ...body, loopId: compared.loopId }, env);
  const previewed = await preview(runtime, { ...body, loopId: compared.loopId }, env);
  const latest = getLatestLoop(runtime);
  return redact({
    ok: previewed.ok !== false,
    version: VERSION,
    at: nowIso(),
    mode: 'dashboardFidelityLoop',
    loopId: compared.loopId,
    goal: latest ? latest.goal : compared.goal,
    baselineScore: latest ? latest.baselineScore : compared.baselineScore,
    actualReferenceVisionUsed: latest ? latest.actualReferenceVisionUsed : compared.actualReferenceVisionUsed,
    actualStudioPixelsUsed: latest ? latest.actualStudioPixelsUsed : compared.actualStudioPixelsUsed,
    limitedComparison: latest ? latest.limitedComparison : compared.limitedComparison,
    mismatches: latest ? latest.mismatches : compared.mismatches,
    safeFixes: latest ? latest.safeFixes : planned.safeFixes,
    manualRequired: latest ? latest.manualRequired : planned.manualRequired,
    preview: previewed,
    pendingApproval: runtime.pendingApproval,
    warnings: previewed.warnings || [],
    blockers: previewed.blockers || [],
    nextCommand: previewed.nextCommand,
  });
}

async function visual(runtime, body = {}) {
  const loop = loopFromBody(runtime, body);
  const goal = goalFrom(body, loop && loop.goal);
  const report = Visual.createCritiqueReport(goal, { source: 'dashboard.fidelityLoop.visual' });
  upsertLoop(runtime, { ...(loop || {}), goal, visualReport: report, visualScore: report.overallScore || report.score || null, status: 'visualComplete' });
  return report;
}

async function score(runtime, body = {}) {
  const loop = loopFromBody(runtime, body);
  const goal = goalFrom(body, loop && loop.goal);
  const premiumManifest = Premium.createPremiumManifest(goal, { source: 'dashboard.fidelityLoop.score' });
  const premium = Premium.scoreFromManifest(premiumManifest);
  const autopilot = Autopilot.createScoreReport ? Autopilot.createScoreReport(goal, { source: 'dashboard.fidelityLoop.score' }) : Autopilot.createFinalReport(goal, { source: 'dashboard.fidelityLoop.score' });
  upsertLoop(runtime, { ...(loop || {}), goal, premiumScore: premium, autopilotScore: autopilot, status: 'scored' });
  return redact({
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal,
    premium,
    autopilot,
    nextCommand: `tools\\bridge.cmd dashboard fidelity-learn "${goal}"`,
  });
}

module.exports = {
  apply,
  compare,
  fixPlan,
  learn,
  loop,
  preview,
  qa,
  recompare,
  rollback,
  score,
  state: createFidelityState,
  visual,
};
