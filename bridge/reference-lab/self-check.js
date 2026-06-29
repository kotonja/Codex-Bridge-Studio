'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const ReferenceLab = require('./index');
const Router = require('../command-router');

const REQUIRED_MODULES = [
  'index.js',
  'schema.js',
  'status.js',
  'intake.js',
  'media-policy.js',
  'reference-store.js',
  'note-analyzer.js',
  'api-image-analyzer.js',
  'style-extractor.js',
  'scene-understanding.js',
  'material-language.js',
  'object-candidates.js',
  'focal-hierarchy.js',
  'layout-hypotheses.js',
  'gameplay-interpretation.js',
  'missing-view-report.js',
  'compare-report.js',
  'production-hints.js',
  'manifest-store.js',
  'memory-integration.js',
  'self-check.js',
];

function runScript(relativePath) {
  const absolutePath = path.join(process.cwd(), relativePath);
  const result = childProcess.spawnSync(process.execPath, [absolutePath], {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: 30000,
  });
  assert.equal(result.status, 0, `${relativePath} failed: ${(result.stderr || result.stdout || '').trim()}`);
  return true;
}

async function runSelfCheck() {
  const dir = __dirname;
  for (const file of REQUIRED_MODULES) assert(fs.existsSync(path.join(dir, file)), `Missing reference lab module: ${file}`);

  const status = ReferenceLab.getStatus();
  assert.equal(status.version, '0.78.0');
  assert.equal(status.safety.doesNotFakeImageAnalysis, true);

  const note = 'dark purple anime dungeon gate with glowing portal';
  const intake = ReferenceLab.getIntakeReport(note, { store: false });
  assert.equal(intake.mode, 'noteOnly');
  assert.equal(intake.actualVisionUsed, false);

  const unavailable = ReferenceLab.getIntakeReport('C:\\definitely\\missing\\reference.png', { store: false });
  assert.equal(unavailable.available, false);
  assert(unavailable.blockers.length > 0);

  const analysis = await ReferenceLab.analyzeReference(note, { storeIntake: false });
  assert.equal(analysis.actualVisionUsed, false);
  assert(analysis.styleProfile.genreGuess);
  for (const key of ['genreGuess', 'mood', 'colorPalette', 'materialPalette', 'shapeLanguage', 'silhouetteRules', 'trimLanguage', 'lightingLanguage', 'VFXLanguage', 'UILanguage', 'cameraLanguage', 'forbiddenCheapPatterns', 'robloxTranslationNotes']) {
    assert(Object.prototype.hasOwnProperty.call(analysis.styleProfile, key), `Missing style field: ${key}`);
  }
  for (const key of ['sceneType', 'likelyScale', 'foreground', 'midground', 'background', 'focalPoints', 'majorStructures', 'propGroups', 'walkableAreasHypothesis', 'blockedAreasHypothesis', 'verticalityHypothesis', 'interiorExteriorGuess', 'gameplayUseCases']) {
    assert(Object.prototype.hasOwnProperty.call(analysis.sceneUnderstanding, key), `Missing scene field: ${key}`);
  }
  assert(Array.isArray(analysis.materialLanguage.robloxBuiltInFallbacks) && analysis.materialLanguage.robloxBuiltInFallbacks.length);
  assert(analysis.objectCandidates.every((candidate) => candidate.buildStrategy));
  assert(analysis.layoutHypotheses.length >= 3);
  assert(analysis.gameplayInterpretation.possiblePlayerSpawn);
  assert(analysis.gameplayInterpretation.likelyObjective);
  assert(analysis.gameplayInterpretation.interactionPoints.length);
  assert(analysis.gameplayInterpretation.traversalRoute.length);
  assert(analysis.missingViews.every((item) => item.safeInference && typeof item.confidence === 'number'));
  for (const key of ['premium', 'worldgen', 'assetforge', 'visual', 'cinematic', 'qa', 'execution', 'memory', 'nextPipeline']) {
    assert(Array.isArray(analysis.productionHints[key]), `Missing production hint group: ${key}`);
  }

  const remembered = await ReferenceLab.remember(note, { source: 'reference.self-check' });
  assert.equal(remembered.rawImageBytesStored, false);
  assert(remembered.item && remembered.item.payload && remembered.item.payload.styleProfile);

  const routes = {
    'analyze this reference': 'reference',
    'image reference': 'reference',
    'use this image as reference': 'reference',
    'turn this image into a style bible': 'reference',
    'reference lab': 'reference',
    'use api': 'ai',
    'api premium run': 'ai',
    'build this for real': 'execution',
    'build and test everything': 'autopilot',
    'remember this style': 'memory',
    'test everything': 'qa',
    'make combat feel good': 'cinematic',
    'make premium anime dungeon hub': 'premiumDirector',
    'make premium props for anime dungeon': 'assetforge',
    'make a dungeon map': 'worldgen',
    'visual critique': 'visual',
    'generate purple sword slash vfx': 'vfx',
    'new pairing code': 'pairing',
  };
  for (const [goal, expected] of Object.entries(routes)) {
    assert.equal(Router.createRoute(goal).category, expected, `Route mismatch for ${goal}`);
  }

  const specialistScripts = [
    'scripts/check-no-bom.js',
    'tests/self-check-ai-orchestrator.js',
    'tests/self-check-execution.js',
    'tests/self-check-memory.js',
    'tests/self-check-autopilot.js',
    'tests/self-check-qa-swarm.js',
    'tests/self-check-cinematic.js',
    'tests/self-check-assetforge.js',
    'tests/self-check-worldgen.js',
    'tests/self-check-visual.js',
    'tests/self-check-premium.js',
    'tests/self-check-plugin-bundle.js',
  ];
  specialistScripts.forEach(runScript);

  return {
    ok: true,
    version: '0.78.0',
    checked: [
      'modules',
      'status',
      'noteOnlyIntake',
      'unavailablePath',
      'analysisContract',
      'styleProfile',
      'sceneUnderstanding',
      'materialLanguage',
      'objectCandidates',
      'layoutHypotheses',
      'gameplayInterpretation',
      'missingViews',
      'productionHints',
      'memoryIntegration',
      'router',
      'specialistSelfChecks',
      'pluginBundleSelfCheck',
      'noBom',
    ],
    noteOnly: {
      mode: analysis.mode,
      actualVisionUsed: analysis.actualVisionUsed,
      confidence: analysis.confidence,
    },
    nextCommand: 'tools\\bridge.cmd reference analyze "dark purple anime dungeon gate"',
  };
}

module.exports = {
  runSelfCheck,
};
