'use strict';

const assert = require('node:assert');
const Premium = require('../bridge/premium');
const CommandRouter = require('../bridge/command-router');
const { BUILD_PHASES, SCORE_KEYS, hasExternalRisk } = require('../bridge/premium/schema');

function assertNoExternalRisk(value, label) {
  const risks = hasExternalRisk(value);
  assert.deepStrictEqual(risks, [], `${label} includes blocked external-risk terms: ${risks.join(', ')}`);
}

function run() {
  const goal = 'premium anime boss lobby';
  const manifest = Premium.createPremiumManifest(goal);
  assert.strictEqual(manifest.version, '0.75.0');
  assert.strictEqual(manifest.goal, goal);
  assert.ok(manifest.nextCommand);
  assert.ok(manifest.productionBrief);
  assert.ok(manifest.styleBible);
  assert.ok(manifest.assetForgePlan);
  assert.ok(manifest.worldGrammarPlan);
  assert.ok(manifest.performanceBudget);
  assert.ok(manifest.qaPlan);
  assert.ok(manifest.qualityScore);
  assert.ok(manifest.visualEvidencePack);
  assert.ok(manifest.visualCritiqueReport);
  assert.ok(manifest.visualPolishPlan);
  assert.ok(manifest.worldgenPlan);
  assert.ok(manifest.worldgenLayoutGraph);
  assert.ok(manifest.worldgenBuildPlan);
  assert.ok(manifest.worldgenAudit);
  assert.ok(manifest.qualityScore.worldgenSummary);
  assert.ok(manifest.assetForgeProPlan);
  assert.ok(manifest.assetForgeKitPlan);
  assert.ok(manifest.assetForgeAudit);
  assert.ok(manifest.qualityScore.assetForgeSummary);
  assert.ok(manifest.cinematicPlan);
  assert.ok(manifest.cinematicTimeline);
  assert.ok(manifest.cinematicBeatSheet);
  assert.ok(manifest.cinematicCameraPlan);
  assert.ok(manifest.cinematicGameFeelPlan);
  assert.ok(manifest.cinematicAudit);
  assert.ok(manifest.qualityScore.cinematicSummary);

  assert.strictEqual(manifest.buildRoundPlan.phases.length, BUILD_PHASES.length);
  for (const phase of BUILD_PHASES) {
    assert.ok(manifest.buildRoundPlan.phases.some((item) => item.name === phase), `Missing phase ${phase}`);
  }

  for (const key of SCORE_KEYS) {
    assert.ok(manifest.qualityScore.subScores[key], `Missing score ${key}`);
    assert.strictEqual(typeof manifest.qualityScore.subScores[key].reason, 'string');
  }

  const route = CommandRouter.createRoute('make a premium anime boss lobby');
  assert.strictEqual(route.category, 'premiumDirector');
  assert.ok(route.commands[0].includes('premium plan'));

  const vfxRoute = CommandRouter.createRoute('generate purple sword slash vfx');
  assert.strictEqual(vfxRoute.category, 'vfx');

  const pairRoute = CommandRouter.createRoute('new pairing code');
  assert.strictEqual(pairRoute.category, 'pairing');

  assertNoExternalRisk(manifest.buildRoundPlan.specialistRoutes, 'specialist routes');
  assertNoExternalRisk(manifest.qaPlan.commands, 'qa commands');

  return {
    ok: true,
    version: Premium.VERSION,
    manifestPath: manifest.manifestPath,
    qualityScore: manifest.qualityScore.score,
    routeCategory: route.category,
    phaseCount: manifest.buildRoundPlan.phases.length,
    scoreKeys: SCORE_KEYS.length,
    visualScore: manifest.visualCritiqueReport.overallScore,
    worldgenScore: manifest.worldgenAudit.overallScore,
    assetForgeScore: manifest.assetForgeAudit.overallScore,
    cinematicScore: manifest.cinematicAudit.overallScore,
  };
}

if (require.main === module) {
  try {
    const result = run();
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exit(1);
  }
}

module.exports = { run };
