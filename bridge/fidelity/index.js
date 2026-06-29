'use strict';

const { VERSION, base, quote, safeGoal, stableFidelityId } = require('./schema');
const { getStatus } = require('./status');
const { createReferenceEvidence } = require('./reference-evidence');
const { createStudioEvidence } = require('./studio-evidence');
const { createComparisonPolicy } = require('./comparison-policy');
const { createFidelityScores } = require('./score');
const { createGapReport } = require('./gap-report');
const { createFixPlan } = require('./fix-plan');
const { rememberFidelityReport } = require('./memory-integration');
const { saveManifest } = require('./manifest-store');

async function compare(input = '', options = {}) {
  const requestedGoal = safeGoal(input);
  const referenceEvidence = options.referenceEvidence || await createReferenceEvidence(requestedGoal, options);
  const studioGoal = options.studioGoal || referenceEvidence.productionGoal || requestedGoal;
  const studioEvidence = options.studioEvidence || await createStudioEvidence(studioGoal, options);
  const policy = createComparisonPolicy(referenceEvidence, studioEvidence);
  const scoreDetails = createFidelityScores(referenceEvidence, studioEvidence);
  const gaps = createGapReport(studioGoal, scoreDetails);
  const safeFixPlan = createFixPlan(studioGoal, gaps.mismatches);
  const matchedElements = Object.entries(scoreDetails.dimensions)
    .filter(([, item]) => item && item.score >= 82)
    .map(([key, item]) => ({ id: key, score: item.score, evidence: (item.observed || []).slice(0, 4) }));
  return base({
    goal: studioGoal,
    requestedReference: requestedGoal,
    comparisonId: stableFidelityId(studioGoal, referenceEvidence.referenceId || requestedGoal),
    mode: policy.mode,
    actualReferenceVisionUsed: policy.actualReferenceVisionUsed,
    actualStudioPixelsUsed: policy.actualStudioPixelsUsed,
    limitedComparison: policy.limitedComparison,
    referenceEvidence,
    studioEvidence,
    scores: scoreDetails.scores,
    matchedElements,
    mismatches: gaps.mismatches,
    intentionalAdaptations: scoreDetails.dimensions.gameplay.adaptations,
    unsafeOrManualRequiredFixes: gaps.unsafeOrManualRequiredFixes,
    safeFixPlan,
    policy,
    warnings: [...policy.limitations, ...(referenceEvidence.warnings || []), ...(studioEvidence.warnings || [])],
    blockers: [...(referenceEvidence.blockers || []), ...(studioEvidence.blockers || [])],
    nextCommand: `tools\\bridge.cmd fidelity fix-plan ${quote(studioGoal)}`,
  });
}

async function reference(input = '', options = {}) {
  return createReferenceEvidence(input, options);
}

async function studio(input = '', options = {}) {
  return createStudioEvidence(input, options);
}

async function score(input = '', options = {}) {
  const report = await compare(input, options);
  return base({
    goal: report.goal,
    comparisonId: report.comparisonId,
    mode: report.mode,
    actualReferenceVisionUsed: report.actualReferenceVisionUsed,
    actualStudioPixelsUsed: report.actualStudioPixelsUsed,
    limitedComparison: report.limitedComparison,
    scores: report.scores,
    warnings: report.warnings,
    blockers: report.blockers,
    nextCommand: `tools\\bridge.cmd fidelity gaps ${quote(report.goal)}`,
  });
}

async function gaps(input = '', options = {}) {
  const report = await compare(input, options);
  return base({
    goal: report.goal,
    comparisonId: report.comparisonId,
    mode: report.mode,
    mismatches: report.mismatches,
    unsafeOrManualRequiredFixes: report.unsafeOrManualRequiredFixes,
    intentionalAdaptations: report.intentionalAdaptations,
    warnings: report.warnings,
    blockers: report.blockers,
    nextCommand: `tools\\bridge.cmd fidelity fix-plan ${quote(report.goal)}`,
  });
}

async function fixPlan(input = '', options = {}) {
  const report = await compare(input, options);
  return base({
    goal: report.goal,
    comparisonId: report.comparisonId,
    safeFixPlan: report.safeFixPlan,
    mismatches: report.mismatches,
    warnings: report.warnings,
    blockers: report.blockers,
    nextCommand: report.safeFixPlan.stages[0] && report.safeFixPlan.stages[0].command,
  });
}

async function memory(input = '', options = {}) {
  const report = await compare(input, options);
  return rememberFidelityReport(report, options);
}

async function manifest(input = '', options = {}) {
  const report = await compare(input, options);
  const stored = saveManifest(report);
  return base({
    goal: report.goal,
    comparisonId: report.comparisonId,
    manifest: report,
    store: stored,
    nextCommand: `tools\\bridge.cmd fidelity memory ${quote(report.goal)}`,
  });
}

module.exports = {
  VERSION,
  compare,
  fixPlan,
  gaps,
  getStatus,
  manifest,
  memory,
  reference,
  score,
  studio,
};
