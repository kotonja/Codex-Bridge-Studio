'use strict';

const { createBaseline } = require('./baseline');
const { normalizeIssues } = require('./issue-normalizer');
const { createPolishPlan } = require('./safe-polish-planner');
const { createPreview } = require('./preview-builder');
const { createRescore } = require('./rescore');
const { createDelta } = require('./score-delta');
const Store = require('./manifest-store');
const { base, safeGoal } = require('./schema');

function createReport(goal, options = {}) {
  const cleanGoal = safeGoal(goal);
  const baseline = Store.readBaseline(cleanGoal) || createBaseline(cleanGoal, options);
  const issueReport = normalizeIssues(cleanGoal, { ...options, baseline });
  const plan = createPolishPlan(cleanGoal, { ...options, issueReport });
  const preview = createPreview(cleanGoal, { ...options, plan });
  const after = Store.readRescore(cleanGoal) || null;
  const delta = createDelta(cleanGoal, { baseline, after });
  return base({
    goal: cleanGoal,
    baselineSummary: { baselineId: baseline.baselineId, scores: baseline.scores },
    issueCount: issueReport.issueCount,
    safeActionCount: plan.safeActionCount,
    manualRequiredCount: plan.manualRequiredCount,
    previewOperationCount: preview.operationCount,
    afterSummary: after ? { rescoreId: after.rescoreId, scores: after.scores } : null,
    delta,
    warnings: [...(baseline.warnings || []), ...(delta.warnings || [])],
    blockers: [],
    nextCommand: `tools\\bridge.cmd polish preview "${cleanGoal}"`,
  });
}

module.exports = { createReport };
