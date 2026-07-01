'use strict';

const { collectEvidence } = require('./evidence-collector');
const Store = require('./manifest-store');
const { SCORE_KEYS, base, safeGoal, scoreOf, stableId } = require('./schema');

function scoreSummary(evidence = {}) {
  return {
    visual: scoreOf(evidence.visual),
    fidelity: scoreOf(evidence.fidelity && (evidence.fidelity.scores || evidence.fidelity)),
    architecture: scoreOf(evidence.architecture),
    detail: scoreOf(evidence.detail),
    materials: scoreOf(evidence.materials),
    qa: scoreOf(evidence.qa),
    premium: scoreOf(evidence.premium),
    autopilot: scoreOf(evidence.autopilot),
  };
}

function collectManualRequired(evidence = {}) {
  const result = [];
  for (const [source, report] of Object.entries(evidence)) {
    if (!report || typeof report !== 'object') continue;
    const items = []
      .concat(Array.isArray(report.manualRequired) ? report.manualRequired : [])
      .concat(Array.isArray(report.manualRequiredActions) ? report.manualRequiredActions : [])
      .concat(Array.isArray(report.blockers) ? report.blockers.map((reason) => ({ reason })) : []);
    for (const item of items) {
      result.push({ source, ...(typeof item === 'object' ? item : { reason: String(item) }) });
    }
  }
  return result.slice(0, 30);
}

function createBaseline(goal, options = {}) {
  const cleanGoal = safeGoal(goal);
  const evidenceReport = collectEvidence(cleanGoal, options);
  const scores = scoreSummary(evidenceReport.evidence);
  const report = base({
    goal: cleanGoal,
    baselineId: stableId('baseline', cleanGoal),
    scores,
    scoreSources: SCORE_KEYS.reduce((acc, key) => {
      acc[key] = scores[key] === null ? 'unavailable' : 'specialistReport';
      return acc;
    }, {}),
    manualRequired: collectManualRequired(evidenceReport.evidence),
    evidence: evidenceReport.evidence,
    unavailable: evidenceReport.unavailable,
    warnings: evidenceReport.warnings,
    blockers: [],
    nextCommand: `tools\\bridge.cmd polish issues "${cleanGoal}"`,
  });
  const stored = Store.saveBaseline(report);
  return { ...report, stored };
}

module.exports = {
  collectManualRequired,
  createBaseline,
  scoreSummary,
};
