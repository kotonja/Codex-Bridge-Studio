'use strict';

const Execution = require('../execution');
const { VERSION, nowIso, redact, safeGoal } = require('./schema');

function safeStageLabel(stage = {}, index = 0) {
  return String(stage.label || stage.title || stage.id || stage.kind || stage.command || `fix_${index + 1}`)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

function splitFixes(fixPlan = {}, report = {}) {
  const stages = Array.isArray(fixPlan.stages) ? fixPlan.stages : [];
  const safeFixes = [];
  const manualRequired = [];
  stages.forEach((stage, index) => {
    const item = { ...stage, label: safeStageLabel(stage, index) };
    const text = JSON.stringify(item).toLowerCase();
    if (item.manualRequired === true || /publish|upload|marketplace|datastore|economy|monetization|non-codex/.test(text)) {
      manualRequired.push({ ...item, reason: item.reason || 'Fix requires manual review or targets an unsafe/external surface.' });
    } else {
      safeFixes.push(item);
    }
  });
  for (const fix of report.unsafeOrManualRequiredFixes || []) {
    manualRequired.push(fix);
  }
  return { safeFixes, manualRequired };
}

function buildExecutionGoal(goal, safeFixes = []) {
  const cleanGoal = safeGoal(goal, 'reference fidelity safe fix');
  const labels = safeFixes.slice(0, 6).map((stage, index) => safeStageLabel(stage, index)).join(', ');
  return `safe fix reference fidelity for ${cleanGoal}${labels ? `: ${labels}` : ''}`;
}

function previewFidelityFixes(goal, report = {}, fixPlan = {}) {
  const cleanGoal = safeGoal(goal, 'reference fidelity safe fix');
  const { safeFixes, manualRequired } = splitFixes(fixPlan.safeFixPlan || fixPlan, report);
  const executionGoal = buildExecutionGoal(cleanGoal, safeFixes);
  const preview = Execution.preview(executionGoal, {
    source: 'dashboard.fidelity.preview',
    system: Execution.SYSTEMS.safeFix,
  });
  return redact({
    ok: preview.ok !== false,
    version: VERSION,
    at: nowIso(),
    goal: cleanGoal,
    mode: 'dashboardFidelityFixPreview',
    status: preview.ok === false ? (preview.status || 'manualRequired') : 'previewed',
    executionGoal,
    transactionId: preview.transactionId,
    safeFixes,
    manualRequired,
    preview,
    approvalRequired: preview.ok !== false,
    warnings: [
      ...(report.warnings || []),
      ...(preview.warnings || []),
      ...(manualRequired.length ? ['Some fidelity fixes are manualRequired and were excluded from the V72 safe preview.'] : []),
    ],
    blockers: preview.blockers || [],
    nextCommand: preview.ok === false
      ? 'tools\\bridge.cmd dashboard fidelity-fix-plan "<reference-or-goal>"'
      : `tools\\bridge.cmd dashboard approve ${preview.transactionId}`,
  });
}

module.exports = {
  buildExecutionGoal,
  previewFidelityFixes,
  splitFixes,
};
