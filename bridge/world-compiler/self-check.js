'use strict';

const fs = require('node:fs');
const path = require('node:path');
const WorldCompiler = require('./index');
const Router = require('../command-router');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function runSelfCheck() {
  const root = __dirname;
  const requiredFiles = [
    'index.js',
    'schema.js',
    'status.js',
    'intake-resolver.js',
    'compile-policy.js',
    'reference-bridge.js',
    'reconstruction-bridge.js',
    'premium-bridge.js',
    'worldgen-bridge.js',
    'assetforge-bridge.js',
    'cinematic-bridge.js',
    'qa-bridge.js',
    'execution-bridge.js',
    'memory-integration.js',
    'fidelity-score.js',
    'playability-score.js',
    'package-builder.js',
    'manifest-store.js',
    'self-check.js',
  ];
  for (const file of requiredFiles) {
    assert(fs.existsSync(path.join(root, file)), `Missing world compiler module: ${file}`);
  }

  const goal = 'dark purple anime dungeon gate with glowing portal';
  const status = WorldCompiler.getStatus();
  assert(status.version === '0.78.0', 'status version should be 0.78.0');
  assert(status.safety && status.safety.doesNotFakeImageAnalysis === true, 'status must expose no-fake-analysis safety');

  const intake = await WorldCompiler.getWorldCompilerIntakeReport(goal);
  assert(intake.inputMode === 'noteOnly', 'note-only input should remain noteOnly');

  const plan = await WorldCompiler.getWorldCompilerPlan(goal);
  assert(plan.pipeline.includes('reference') && plan.pipeline.includes('executionPreview'), 'plan must include full pipeline');

  const compile = await WorldCompiler.getWorldCompilerCompileReport(goal);
  assert(compile.actualVisionUsed === false, 'note-only compile must not fake actualVisionUsed');
  for (const key of ['reference', 'reconstruction', 'premiumPlan', 'worldgen', 'assetForge', 'cinematic', 'qa', 'executionPreview']) {
    assert(compile[key], `compile report missing ${key}`);
  }
  for (const key of ['referenceFidelity', 'structuralCompleteness', 'playability', 'assetReadiness', 'cinematicReadiness', 'qaReadiness', 'executionReadiness', 'overall']) {
    assert(typeof compile.scores[key] === 'number', `compile scores missing ${key}`);
  }
  assert(compile.createdNothingYet === true, 'compile must not claim Studio execution');
  assert(compile.requiresExecuteApply === true, 'compile must require V72 apply');

  const pkg = await WorldCompiler.getWorldCompilerPackage(goal, { storeIntake: false });
  for (const key of ['referenceProfile', 'reconstructionProfile', 'worldgenGraph', 'assetKitPlan', 'cinematicPlan', 'qaPlan', 'executionPreviewPlan', 'acceptanceGates']) {
    assert(pkg[key], `package missing ${key}`);
  }
  assert(pkg.worldgenGraph.zones && pkg.worldgenGraph.paths && pkg.worldgenGraph.landmarks && pkg.worldgenGraph.vistas && pkg.worldgenGraph.sockets && pkg.worldgenGraph.qaRoutes, 'worldgen bridge must return V66-compatible graph data');
  assert(Array.isArray(pkg.assetKitPlan.assetFamilies), 'assetforge bridge must return V67-compatible asset families');
  assert(pkg.cinematicPlan.timeline && pkg.cinematicPlan.beats, 'cinematic bridge must return V68-compatible timing');
  assert(pkg.qaPlan.launchReadiness, 'QA bridge must return V69-compatible launch readiness');
  assert(pkg.executionPreviewPlan.previewOnly === true, 'execution bridge must be preview only');

  const unavailable = await WorldCompiler.getWorldCompilerIntakeReport('C:\\missing\\not-real-reference.png', { storeIntake: false });
  assert(unavailable.inputMode === 'unavailable', 'missing image path must be unavailable');
  assert(unavailable.blockers.length > 0, 'missing image path must report blockers');

  const routeExpectations = [
    ['turn this image into a world', 'worldcompile'],
    ['image to world', 'worldcompile'],
    ['reference to world', 'worldcompile'],
    ['build from this reference', 'worldcompile'],
    ['make this reference playable', 'worldcompile'],
    ['turn this concept into a playable map', 'worldcompile'],
    ['make a playable world from this', 'worldcompile'],
    ['infer the inside', 'reconstruction'],
    ['analyze this reference', 'reference'],
    ['use api', 'ai'],
    ['build this for real', 'execution'],
    ['build and test everything', 'autopilot'],
    ['remember this style', 'memory'],
    ['test everything', 'qa'],
    ['make combat feel good', 'cinematic'],
    ['make premium anime dungeon hub', 'premiumDirector'],
    ['make premium props for anime dungeon', 'assetforge'],
    ['make a dungeon map', 'worldgen'],
    ['visual critique', 'visual'],
    ['generate purple sword slash vfx', 'vfx'],
    ['new pairing code', 'pairing'],
  ];
  const routerResults = routeExpectations.map(([query, expected]) => {
    const route = Router.createRoute(query);
    assert(route.category === expected, `router expected ${query} -> ${expected}, got ${route.category}`);
    return { query, expected, actual: route.category, ok: true };
  });

  const score = await WorldCompiler.getWorldCompilerScore(goal, { storeIntake: false });
  assert(score.referenceFidelityScore > 0 && score.playabilityScore > 0, 'score must include fidelity and playability');

  return {
    ok: true,
    version: '0.78.0',
    checkedModules: requiredFiles.length,
    status: status.status,
    sampleGoal: goal,
    noFakeAnalysis: compile.actualVisionUsed === false,
    compileStatus: compile.status,
    referenceFidelityScore: compile.scores.referenceFidelity,
    playabilityScore: compile.scores.playability,
    overallScore: compile.scores.overall,
    routerResults,
    warnings: [],
    blockers: [],
    nextCommand: 'tools\\bridge.cmd worldcompile compile "dark purple anime dungeon gate with glowing portal"',
  };
}

module.exports = { runSelfCheck };
