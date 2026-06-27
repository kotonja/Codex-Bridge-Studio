'use strict';

const { VERSION, ROOTS, SCORE_KEYS, SHOT_IDS, POLISH_STAGES, ratingFromScore, safeGoal, nowIso } = require('./schema');
const { createEvidencePack } = require('./evidence-pack');
const { createShotPlan } = require('./camera-shot-plan');
const { createVisualQualityScore } = require('./visual-score');
const { createVisualPolishPlan } = require('./polish-plan');
const { createVisualCompareReport } = require('./compare-report');
const { createManifest, manifestPath } = require('./manifest-store');

function problemFromScore(key, scoreEntry, goal) {
  const categoryMap = {
    lightingDepth: 'lighting',
    cameraComposition: 'composition',
    focalHierarchy: 'composition',
    materialCohesion: 'materials',
    scaleAndProportion: 'scale',
    uiIntegration: 'ui',
    vfxIntegration: 'vfx',
    performanceRisk: 'performance',
    mobileReadability: 'gameplayReadability',
  };
  return {
    severity: scoreEntry.score < 55 ? 'blocker' : scoreEntry.score < 68 ? 'high' : scoreEntry.score < 78 ? 'medium' : 'low',
    category: categoryMap[key] || 'composition',
    problem: `${key} is not premium-proof yet.`,
    whyItLooksCheap: scoreEntry.reason,
    exactFix: (scoreEntry.fixes && scoreEntry.fixes[0]) || 'Run a targeted polish pass with visual evidence.',
    suggestedCommand: `tools\\bridge.cmd visual polish "${goal}"`,
  };
}

function createCritiqueReport(goal, options = {}) {
  const cleanGoal = safeGoal(goal || options.goal || options.intent);
  const evidencePack = options.evidencePack || createEvidencePack(cleanGoal, options);
  const qualityScore = createVisualQualityScore(cleanGoal, evidencePack, options);
  const sorted = Object.entries(qualityScore.subScores)
    .sort((a, b) => a[1].score - b[1].score);
  const topProblems = sorted.slice(0, 6).map(([key, entry]) => problemFromScore(key, entry, cleanGoal));
  const bestStrengths = Object.entries(qualityScore.subScores)
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 4)
    .map(([key, entry]) => ({ category: key, score: entry.score, evidence: entry.evidence[0], preserve: entry.fixes[0] }));
  const polishPlan = createVisualPolishPlan(cleanGoal, qualityScore);
  return {
    ok: true,
    version: VERSION,
    goal: cleanGoal,
    at: nowIso(),
    overallScore: qualityScore.overallScore,
    rating: ratingFromScore(qualityScore.overallScore),
    subScores: qualityScore.subScores,
    topProblems,
    bestStrengths,
    evidencePack,
    visualEvidenceSummary: summarizeEvidence(evidencePack),
    polishPlan,
    warnings: evidencePack.warnings || [],
    blockers: evidencePack.blockers || [],
    nextCommand: `tools\\bridge.cmd visual polish "${cleanGoal}"`,
  };
}

function summarizeEvidence(evidencePack) {
  const available = evidencePack.availableEvidence || {};
  return {
    liveVision: available.liveVision === true,
    screenControl: available.screenControl === true,
    cameraReport: available.cameraReport === true,
    playtestSnapshot: available.playtestSnapshot === true,
    actualPixels: available.actualPixels === true,
    shotCount: Array.isArray(evidencePack.shots) ? evidencePack.shots.length : 0,
    limitation: available.actualPixels === true ? null : 'Actual screenshot pixel analysis unavailable; structured evidence used.',
  };
}

function createStatus(options = {}) {
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    status: 'ready',
    name: 'V65 Visual Critic + Screenshot Evidence',
    roots: ROOTS,
    actualPixelsDefault: false,
    evidenceSources: ['live-vision', 'screen-control', 'camera-report', 'playtest-snapshot', 'manual screenshot when supplied'],
    commands: [
      'tools\\bridge.cmd visual evidence',
      'tools\\bridge.cmd visual critique "<goal>"',
      'tools\\bridge.cmd visual score "<goal>"',
      'tools\\bridge.cmd visual polish "<goal>"',
      'tools\\bridge.cmd visual compare <reportA> <reportB>',
    ],
    warnings: options.warnings || [],
    blockers: options.blockers || [],
    nextCommand: 'tools\\bridge.cmd visual critique "premium anime boss lobby"',
  };
}

function createScoreReport(goal, options = {}) {
  const evidencePack = options.evidencePack || createEvidencePack(goal, options);
  const score = createVisualQualityScore(safeGoal(goal), evidencePack, options);
  return {
    ...score,
    evidencePack,
    visualEvidenceSummary: summarizeEvidence(evidencePack),
  };
}

module.exports = {
  VERSION,
  ROOTS,
  SCORE_KEYS,
  SHOT_IDS,
  POLISH_STAGES,
  createCritiqueReport,
  createEvidencePack,
  createManifest,
  createScoreReport,
  createShotPlan,
  createStatus,
  createVisualCompareReport,
  createVisualPolishPlan,
  manifestPath,
  summarizeEvidence,
};
