'use strict';

const { VERSION, nowIso, redact } = require('./schema');

const PRESETS = [
  {
    id: 'referenceToWorldPreview',
    title: 'Reference To World Preview',
    mode: 'preview',
    summary: 'Analyze a reference, reconstruct missing spaces, package a world plan, and create an execution preview.',
    actions: ['memoryRecommend', 'referenceAnalyze', 'reconstructInfer', 'worldcompilePackage', 'executePreview'],
  },
  {
    id: 'referenceToWorldApply',
    title: 'Reference To World Apply',
    mode: 'approvalRequired',
    summary: 'Run the preview chain, then wait for explicit dashboard approval before Execute Apply.',
    actions: ['memoryRecommend', 'referenceAnalyze', 'reconstructInfer', 'worldcompilePackage', 'executePreview', 'approvalGate', 'executeApply', 'executeVerify'],
  },
  {
    id: 'imageToWorldPreview',
    title: 'Image To World Preview',
    mode: 'preview',
    summary: 'Route an image/reference path through honest intake, reconstruction, worldcompile, and execution preview.',
    actions: ['memoryRecommend', 'dashboardImageAnalyze', 'dashboardImageWorldcompile', 'executePreview'],
  },
  {
    id: 'dashboardQaLaunch',
    title: 'Dashboard QA Launch',
    mode: 'readOnly',
    summary: 'Run visual, fidelity, QA launch, and autopilot score surfaces for launch-readiness evidence.',
    actions: ['visualCritique', 'fidelityCompare', 'qaLaunch', 'autopilotReport'],
  },
  {
    id: 'fidelityFixLoop',
    title: 'Fidelity Fix Loop',
    mode: 'preview',
    summary: 'Compare against the reference, create a safe preview fix path, and stop at approval.',
    actions: ['fidelityCompare', 'worldcompilePackage', 'executePreview', 'visualCritique', 'qaLaunch'],
  },
  {
    id: 'safeRollback',
    title: 'Safe Rollback',
    mode: 'receiptRequired',
    summary: 'Rollback a specific transaction receipt and verify only receipt-created objects are touched.',
    actions: ['executeRollback', 'executeVerify'],
  },
  {
    id: 'memoryLearn',
    title: 'Memory Learn',
    mode: 'localMemory',
    summary: 'Learn from the current dashboard trial and update redacted production memory.',
    actions: ['memoryLearn', 'memoryRecommend'],
  },
  {
    id: 'fullPremiumAutopilot',
    title: 'Full Premium Autopilot',
    mode: 'preview',
    summary: 'Run a bounded premium production pass with preview, evidence, QA, and score aggregation.',
    actions: ['memoryRecommend', 'referenceAnalyze', 'reconstructInfer', 'worldcompilePackage', 'executePreview', 'visualCritique', 'fidelityCompare', 'qaLaunch', 'autopilotReport'],
  },
];

function listPresets() {
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    presets: PRESETS.map((preset) => redact(preset)),
    warnings: [],
    blockers: [],
    nextCommand: 'tools\\bridge.cmd dashboard pipeline "premium anime dungeon hub"',
  };
}

function getPreset(idOrGoal = '') {
  const text = String(idOrGoal || '').toLowerCase();
  return PRESETS.find((preset) => preset.id.toLowerCase() === text)
    || (text.includes('image') ? PRESETS.find((preset) => preset.id === 'imageToWorldPreview') : null)
    || (text.includes('qa') || text.includes('launch') ? PRESETS.find((preset) => preset.id === 'dashboardQaLaunch') : null)
    || (text.includes('fidelity') || text.includes('closer') || text.includes('match') ? PRESETS.find((preset) => preset.id === 'fidelityFixLoop') : null)
    || (text.includes('rollback') ? PRESETS.find((preset) => preset.id === 'safeRollback') : null)
    || (text.includes('learn') || text.includes('memory') ? PRESETS.find((preset) => preset.id === 'memoryLearn') : null)
    || (text.includes('autopilot') || text.includes('everything') || text.includes('premium') ? PRESETS.find((preset) => preset.id === 'fullPremiumAutopilot') : null)
    || PRESETS.find((preset) => preset.id === 'referenceToWorldPreview');
}

module.exports = {
  PRESETS,
  getPreset,
  listPresets,
};
