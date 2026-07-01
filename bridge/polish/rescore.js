'use strict';

const { collectEvidence } = require('./evidence-collector');
const { scoreSummary } = require('./baseline');
const Store = require('./manifest-store');
const { base, safeGoal, stableId } = require('./schema');

function createRescore(goal, options = {}) {
  const cleanGoal = safeGoal(goal);
  const evidenceReport = collectEvidence(cleanGoal, { ...options, source: 'polish.rescore' });
  const report = base({
    goal: cleanGoal,
    rescoreId: stableId('rescore', cleanGoal),
    scores: scoreSummary(evidenceReport.evidence),
    evidence: evidenceReport.evidence,
    unavailable: evidenceReport.unavailable,
    warnings: evidenceReport.warnings,
    blockers: [],
    nextCommand: `tools\\bridge.cmd polish delta "${cleanGoal}"`,
  });
  const stored = Store.saveRescore(report);
  return { ...report, stored };
}

module.exports = { createRescore };
