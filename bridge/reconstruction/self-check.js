'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const Reconstruction = require('./index');
const Router = require('../command-router');

const REQUIRED_MODULES = [
  'index.js',
  'schema.js',
  'status.js',
  'reference-resolver.js',
  'confidence.js',
  'spatial-taxonomy.js',
  'structure-inference.js',
  'exterior-completion.js',
  'backside-inference.js',
  'interior-inference.js',
  'floorplan-inference.js',
  'room-graph.js',
  'route-inference.js',
  'gameplay-space.js',
  'collision-inference.js',
  'verticality-inference.js',
  'variant-generator.js',
  'worldgen-bridge.js',
  'assetforge-bridge.js',
  'execution-plan.js',
  'memory-integration.js',
  'manifest-store.js',
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

function assertInferenceItem(item) {
  assert(item.id, 'Inference item missing id');
  assert(item.inference, `Inference ${item.id} missing inference text`);
  assert(item.reason, `Inference ${item.id} missing reason`);
  assert.equal(typeof item.confidence, 'number', `Inference ${item.id} missing numeric confidence`);
  assert(Array.isArray(item.sourceEvidence), `Inference ${item.id} missing sourceEvidence`);
  assert(['low', 'medium', 'high'].includes(item.risk), `Inference ${item.id} missing risk`);
  assert(Array.isArray(item.alternatives), `Inference ${item.id} missing alternatives`);
  assert.equal(typeof item.needsUserReference, 'boolean', `Inference ${item.id} missing needsUserReference`);
}

async function runSelfCheck() {
  const dir = __dirname;
  for (const file of REQUIRED_MODULES) assert(fs.existsSync(path.join(dir, file)), `Missing reconstruction module: ${file}`);

  const status = Reconstruction.getStatus();
  assert.equal(status.version, '0.75.0');
  assert.equal(status.ok, true);
  assert.equal(status.safety.readOnlyByDefault, true);
  assert.equal(status.safety.doesNotClaimCertainty, true);
  assert.equal(status.safety.executionRequiresV72, true);

  const prompt = 'haunted mansion exterior with purple portal';
  const report = await Reconstruction.createInferenceReport(prompt);
  assert.equal(report.version, '0.75.0');
  assert.equal(report.actualVisionUsed, false);
  assert(report.overallConfidence > 0 && report.overallConfidence < 1);
  assert(Array.isArray(report.shownElements) && report.shownElements.length);
  assert(Array.isArray(report.missingElements) && report.missingElements.length);
  assert(Array.isArray(report.safeInferences) && report.safeInferences.length);
  assert(Array.isArray(report.uncertainInferences) && report.uncertainInferences.length);
  [...report.safeInferences, ...report.uncertainInferences].forEach(assertInferenceItem);

  const interior = await Reconstruction.getInteriorInferencePlan(prompt);
  assert(interior.rooms.length >= 4);
  assert(interior.verticalLinks);

  const backside = await Reconstruction.getBacksideInferencePlan(prompt);
  assert(backside.alternatives.some((item) => item.id === 'faithfulReference') === false);
  assert(backside.alternatives.length >= 3);
  assert.equal(typeof backside.backsidePlan.confidence, 'number');

  const floorplan = await Reconstruction.getFloorplanInferencePlan(prompt);
  assert(floorplan.floorplan.levels.length);
  assert(floorplan.floorplan.levels[0].rooms.length);
  assert(floorplan.floorplan.levels[0].connections.length);

  const rooms = await Reconstruction.getRoomGraphPlan(prompt);
  for (const room of rooms.rooms) {
    for (const key of ['id', 'name', 'role', 'approxSize', 'adjacentTo', 'entryPoints', 'exits', 'gameplayUse', 'assetNeeds', 'lightingNeeds', 'vfxNeeds', 'qaRisks', 'confidence']) {
      assert(Object.prototype.hasOwnProperty.call(room, key), `Room missing ${key}`);
    }
  }

  const routes = await Reconstruction.getRouteInferencePlan(prompt);
  const routeIds = new Set(routes.routes.map((route) => route.id));
  for (const id of ['spawn_to_entry', 'entry_to_primary_goal', 'entry_to_shop', 'entry_to_quest', 'entry_to_portal', 'entry_to_reward', 'full_loop', 'secret_route_optional', 'mobile_safe_route']) {
    assert(routeIds.has(id), `Missing route ${id}`);
  }

  const gameplay = await Reconstruction.getGameplaySpacePlan(prompt);
  const spaceRoles = new Set(gameplay.gameplaySpaces.spaces.map((space) => space.role));
  for (const role of ['shop', 'quest', 'portal', 'combat', 'social', 'reward']) assert(spaceRoles.has(role), `Missing gameplay role ${role}`);
  assert(gameplay.gameplaySpaces.spawnLocation);
  assert(gameplay.gameplaySpaces.firstObjective);
  assert(gameplay.gameplaySpaces.cinematicMoments.length);

  const collisions = await Reconstruction.getCollisionInferencePlan(prompt);
  const collisionText = JSON.stringify(collisions.collisionZones);
  for (const needle of ['blocked decorations', 'no-collision VFX/decor', 'collision proxies', 'path clearances']) assert(collisionText.includes(needle), `Missing collision ${needle}`);

  const variants = await Reconstruction.getReconstructionVariants(prompt);
  const variantIds = new Set(variants.variants.map((variant) => variant.id));
  for (const id of ['faithfulReference', 'gameplayFirst', 'mobileOptimized']) assert(variantIds.has(id), `Missing variant ${id}`);

  const worldgen = await Reconstruction.getWorldgenReconstructionBridge(prompt);
  assert(worldgen.worldgen.zones.length);
  assert(worldgen.worldgen.paths.length);
  assert(worldgen.worldgen.landmarks.length);
  assert(worldgen.worldgen.qaRoutes.length);

  const assetforge = await Reconstruction.getAssetForgeReconstructionBridge(prompt);
  assert(assetforge.assetforge.assetFamilies.length);
  assert(assetforge.assetforge.materialPalette.length);
  assert(assetforge.assetforge.socketPlan.length);

  const execution = await Reconstruction.getExecutionReconstructionPlan(prompt);
  assert.equal(execution.executionPlan.previewOnly, true);
  assert.equal(execution.executionPlan.executionRequiresV72, true);
  assert.equal(execution.executionPlan.mutatesStudioDirectly, false);

  const routesExpected = {
    'infer the inside': 'reconstruction',
    'generate the inside': 'reconstruction',
    'what is behind this': 'reconstruction',
    'infer the back side': 'reconstruction',
    'create floorplan from image': 'reconstruction',
    'missing structure': 'reconstruction',
    'structural reconstruction': 'reconstruction',
    'analyze this reference': 'reference',
    'image reference': 'reference',
    'use api': 'ai',
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
  for (const [goal, expected] of Object.entries(routesExpected)) {
    assert.equal(Router.createRoute(goal).category, expected, `Route mismatch for ${goal}`);
  }

  const specialistScripts = [
    'scripts/check-no-bom.js',
    'tests/self-check-reference-lab.js',
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
    version: '0.75.0',
    checked: [
      'modules',
      'status',
      'inferenceContract',
      'inferenceItems',
      'interior',
      'backside',
      'floorplan',
      'roomGraph',
      'routes',
      'gameplaySpaces',
      'collisionZones',
      'variants',
      'worldgenBridge',
      'assetforgeBridge',
      'executionPreviewOnly',
      'router',
      'specialistSelfChecks',
      'noBom',
    ],
    sample: {
      goal: report.goal,
      overallConfidence: report.overallConfidence,
      firstRoom: report.roomGraph.rooms[0],
      firstRoute: report.routes[0],
      firstUncertainInference: report.uncertainInferences[0],
    },
    nextCommand: 'tools\\bridge.cmd reconstruct infer "haunted mansion exterior with purple portal"',
  };
}

module.exports = {
  runSelfCheck,
};

