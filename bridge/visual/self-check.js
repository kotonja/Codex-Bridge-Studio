'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const Visual = require('./index');
const CommandRouter = require('../command-router');
const Premium = require('../premium');
const { SCORE_KEYS, SHOT_IDS, POLISH_STAGES } = require('./schema');

function assertFilesExist() {
  const root = path.resolve(__dirname, '..', '..');
  const files = [
    'bridge/visual/index.js',
    'bridge/visual/schema.js',
    'bridge/visual/evidence-pack.js',
    'bridge/visual/camera-shot-plan.js',
    'bridge/visual/critique-rubric.js',
    'bridge/visual/visual-score.js',
    'bridge/visual/polish-plan.js',
    'bridge/visual/compare-report.js',
    'bridge/visual/manifest-store.js',
    'bridge/visual/self-check.js',
  ];
  for (const file of files) {
    assert.ok(fs.existsSync(path.join(root, file)), `Missing ${file}`);
  }
}

function run() {
  assertFilesExist();
  const goal = 'premium anime boss lobby';
  const status = Visual.createStatus();
  assert.strictEqual(status.version, '0.80.0');
  assert.strictEqual(status.ok, true);

  const evidence = Visual.createEvidencePack(goal, { studioConnected: true });
  assert.strictEqual(evidence.availableEvidence.actualPixels, false);
  for (const id of SHOT_IDS) {
    assert.ok(evidence.shots.some((shot) => shot.id === id), `Missing shot ${id}`);
  }
  assert.ok(evidence.warnings.some((warning) => warning.includes('Actual screenshot pixel analysis unavailable')));

  const critique = Visual.createCritiqueReport(goal, { evidencePack: evidence });
  assert.strictEqual(critique.version, '0.80.0');
  assert.ok(critique.overallScore >= 0 && critique.overallScore <= 100);
  for (const key of SCORE_KEYS) {
    const item = critique.subScores[key];
    assert.ok(item, `Missing sub-score ${key}`);
    assert.ok(item.score >= 0 && item.score <= 100, `Invalid score ${key}`);
    assert.ok(Array.isArray(item.evidence), `Missing evidence ${key}`);
    assert.ok(Array.isArray(item.fixes), `Missing fixes ${key}`);
    assert.strictEqual(typeof item.reason, 'string');
  }

  const score = Visual.createScoreReport(goal, { evidencePack: evidence });
  assert.ok(score.overallScore >= 0 && score.overallScore <= 100);
  for (const key of SCORE_KEYS) assert.ok(score.subScores[key], `Score missing ${key}`);

  const polish = Visual.createVisualPolishPlan(goal, critique);
  assert.strictEqual(polish.stages.length, POLISH_STAGES.length);
  for (const stage of POLISH_STAGES) {
    assert.ok(polish.stages.some((item) => item.stage === stage), `Missing polish stage ${stage}`);
  }

  const compare = Visual.createVisualCompareReport({ ...critique, overallScore: 60 }, { ...critique, overallScore: 78 }, { goal });
  assert.strictEqual(compare.scoreDelta, 18);

  assert.strictEqual(CommandRouter.createRoute('visual critique').category, 'visual');
  assert.strictEqual(CommandRouter.createRoute('make a premium anime boss lobby').category, 'premiumDirector');
  assert.strictEqual(CommandRouter.createRoute('generate purple sword slash vfx').category, 'vfx');
  assert.strictEqual(CommandRouter.createRoute('new pairing code').category, 'pairing');

  const premium = Premium.createPremiumManifest(goal);
  assert.strictEqual(premium.version, '0.80.0');
  assert.ok(premium.visualCritiqueReport);
  assert.strictEqual(premium.visualEvidencePack.availableEvidence.actualPixels, false);
  assert.strictEqual(Premium.scoreFromManifest(premium).version, '0.80.0');

  return {
    ok: true,
    version: Visual.VERSION,
    status: status.status,
    shotCount: evidence.shots.length,
    scoreKeys: SCORE_KEYS.length,
    polishStages: polish.stages.length,
    routeCategory: CommandRouter.createRoute('visual critique').category,
    premiumRouteCategory: CommandRouter.createRoute('make a premium anime boss lobby').category,
    vfxRouteCategory: CommandRouter.createRoute('generate purple sword slash vfx').category,
    pairingRouteCategory: CommandRouter.createRoute('new pairing code').category,
    actualPixelsDefault: evidence.availableEvidence.actualPixels,
  };
}

module.exports = { run };
