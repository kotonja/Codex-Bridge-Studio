'use strict';

const Visual = require('../visual');
const Fidelity = require('../fidelity');
const Architecture = require('../architecture');
const Detail = require('../detail');
const Materials = require('../materials');
const QaSwarm = require('../qa-swarm');
const Premium = require('../premium');
const Autopilot = require('../autopilot');
const Execution = require('../execution');
const { VERSION, base, safeGoal } = require('./schema');

function createFidelityFallback(goal) {
  return {
    ok: true,
    version: VERSION,
    goal,
    mode: 'syncFidelitySummary',
    actualReferenceVisionUsed: false,
    actualStudioPixelsUsed: false,
    limitedComparison: true,
    scores: {
      overallScore: 76,
      silhouetteMatch: 76,
      paletteMatch: 78,
      layoutMatch: 74,
      objectCoverage: 75,
      moodMatch: 78,
    },
    mismatches: [],
    unsafeOrManualRequiredFixes: [
      {
        id: 'real_reference_pixel_compare',
        status: 'manualRequired',
        reason: 'Full V80 fidelity comparison is async and requires explicit reference/studio evidence; V96 sync baseline uses bounded summary only.',
      },
    ],
    warnings: ['Fidelity baseline uses sync summary fallback; run tools\\bridge.cmd fidelity compare for full evidence.'],
    blockers: [],
    nextCommand: `tools\\bridge.cmd fidelity compare "${goal}"`,
  };
}

function safeCall(label, fn) {
  try {
    const value = fn();
    if (value && typeof value.then === 'function') {
      return {
        ok: false,
        value: null,
        warning: `${label} returned an async report; V96 sync evidence used a bounded fallback instead.`,
      };
    }
    return { ok: true, value };
  } catch (error) {
    return {
      ok: false,
      value: null,
      warning: `${label} failed: ${error && error.message ? error.message : String(error)}`,
    };
  }
}

function collectEvidence(goal, options = {}) {
  const cleanGoal = safeGoal(goal);
  const calls = {
    visual: safeCall('visual critique', () => Visual.createCritiqueReport(cleanGoal, { source: 'polish.evidence.visual', ...options })),
    fidelity: safeCall('fidelity compare', () => createFidelityFallback(cleanGoal, { source: 'polish.evidence.fidelity', ...options })),
    architecture: safeCall('architecture audit', () => Architecture.createAuditReport(cleanGoal, { source: 'polish.evidence.architecture', ...options })),
    detail: safeCall('detail audit', () => Detail.createAuditReport(cleanGoal, { source: 'polish.evidence.detail', ...options })),
    materials: safeCall('materials audit', () => Materials.createAuditReport(cleanGoal, { source: 'polish.evidence.materials', ...options })),
    qa: safeCall('qa launch', () => QaSwarm.createLaunchReadinessReport(cleanGoal, { source: 'polish.evidence.qa', ...options })),
    premium: safeCall('premium score', () => Premium.scoreFromManifest(Premium.createPremiumManifest(cleanGoal, { source: 'polish.evidence.premium', ...options }))),
    autopilot: safeCall('autopilot score', () => Autopilot.createScoreReport(cleanGoal, { source: 'polish.evidence.autopilot', ...options })),
    autopilotReport: safeCall('autopilot report', () => Autopilot.createFinalReport(cleanGoal, { source: 'polish.evidence.autopilotReport', ...options })),
    execution: safeCall('execution status', () => Execution.createStatus()),
  };
  const warnings = Object.values(calls).filter((entry) => !entry.ok && entry.warning).map((entry) => entry.warning);
  return base({
    version: VERSION,
    goal: cleanGoal,
    evidence: Object.fromEntries(Object.entries(calls).map(([key, entry]) => [key, entry.value])),
    unavailable: Object.fromEntries(Object.entries(calls).filter(([, entry]) => !entry.ok).map(([key, entry]) => [key, entry.warning])),
    warnings,
    nextCommand: `tools\\bridge.cmd polish issues "${cleanGoal}"`,
  });
}

module.exports = {
  collectEvidence,
};
