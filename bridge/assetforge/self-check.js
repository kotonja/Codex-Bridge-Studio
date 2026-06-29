'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const AssetForge = require('./index');
const Router = require('../command-router');
const Worldgen = require('../worldgen');
const Visual = require('../visual');
const Premium = require('../premium');

const MODULES = [
  'index.js',
  'schema.js',
  'style-catalog.js',
  'goal-parser.js',
  'asset-taxonomy.js',
  'kit-planner.js',
  'kitbash-planner.js',
  'mesh-planner.js',
  'material-planner.js',
  'surface-appearance-plan.js',
  'decal-signage-plan.js',
  'socket-planner.js',
  'collision-planner.js',
  'lod-planner.js',
  'mobile-budget.js',
  'library-scanner.js',
  'reuse-ranker.js',
  'build-plan.js',
  'audit-report.js',
  'polish-plan.js',
  'manifest-store.js',
  'self-check.js',
];

const REQUIRED_KIT_SECTIONS = [
  'focalLandmarks',
  'secondaryLandmarks',
  'pathTrim',
  'groundTiles',
  'wallModules',
  'shopModules',
  'questModules',
  'portalModules',
  'rewardModules',
  'propsSmall',
  'propsMedium',
  'signage',
  'lightingFixtures',
  'vfxSockets',
  'audioSockets',
  'collisionProxies',
  'mobileFallbacks',
];

function assertRoute(query, category) {
  const route = Router.createRoute(query, { version: AssetForge.VERSION });
  assert.equal(route.category, category, `${query} should route to ${category}, got ${route.category}`);
  return route;
}

function run() {
  for (const file of MODULES) {
    assert.ok(fs.existsSync(path.join(__dirname, file)), `missing assetforge module ${file}`);
  }
  const goal = 'premium anime dungeon hub asset kit';
  const status = AssetForge.createStatus();
  assert.equal(status.version, '0.78.0');
  assert.equal(status.ok, true);
  assert.equal(status.integrations.worldgen, true);
  const styles = AssetForge.getStyleCatalog();
  assert.ok(styles.length >= 16, 'asset style catalog needs at least 16 styles');
  for (const style of styles) {
    for (const field of ['visualPillars', 'shapeLanguage', 'silhouetteRules', 'materialLanguage', 'colorPalette', 'trimLanguage', 'bevelRules', 'decalLanguage', 'vfxSocketLanguage', 'audioSocketLanguage', 'animationSocketLanguage', 'collisionRules', 'mobileBudgetHints', 'forbiddenCheapPatterns']) {
      assert.ok(Array.isArray(style[field]), `style ${style.id} missing ${field}`);
    }
  }
  const plan = AssetForge.createIntentPlan(goal);
  assert.ok(Array.isArray(plan.assetFamilies) && plan.assetFamilies.length >= REQUIRED_KIT_SECTIONS.length);
  assert.ok(plan.assetFamilies.every((family) => Array.isArray(family.taxonomy) && family.taxonomy.length > 0), 'families need taxonomy');
  const kit = AssetForge.createKitPlan(goal);
  for (const section of REQUIRED_KIT_SECTIONS) {
    assert.ok(kit.sections[section], `kit missing ${section}`);
    for (const field of ['assets', 'variantCount', 'reuseRules', 'placementRules', 'budgetRules', 'styleNotes']) {
      assert.ok(kit.sections[section][field] !== undefined, `kit section ${section} missing ${field}`);
    }
  }
  const mesh = AssetForge.createMeshPlan(goal);
  assert.ok(Array.isArray(mesh.meshAssets));
  assert.ok(mesh.meshAssets.some((item) => item.meshSpec.manualRequired === true), 'mesh plan must be honest manualRequired');
  assert.ok(mesh.meshAssets.every((item) => item.meshSpec.textureSlots.includes('baseColor')), 'mesh plan needs texture slots');
  const material = AssetForge.createMaterialPlan(goal);
  assert.ok(Array.isArray(material.materialVariants) && material.materialVariants.length > 0);
  assert.ok(Array.isArray(material.surfaceAppearanceCandidates));
  assert.ok(material.surfaceAppearanceCandidates.every((item) => item.manualRequired === true), 'SurfaceAppearance maps must not fake IDs');
  assert.ok(Array.isArray(material.fallbackRobloxMaterials));
  const sockets = AssetForge.createSocketPlan(goal);
  for (const type of AssetForge.SOCKET_TYPES) {
    assert.ok(sockets.sockets.some((socket) => socket.type === type), `socket plan missing ${type}`);
  }
  const budget = AssetForge.createBudgetReport(goal);
  assert.ok(budget.budget.limits);
  assert.ok(Array.isArray(budget.lodPlan));
  assert.ok(Array.isArray(budget.budget.fallbackRules));
  const library = AssetForge.createLibraryReport('Workspace.AssetKit', { studioConnected: false });
  assert.equal(library.available, false);
  assert.equal(library.nextCommand, 'tools\\bridge.cmd connect');
  const manifest = AssetForge.createManifest(goal);
  for (const field of ['version', 'goal', 'assetKitId', 'warnings', 'blockers', 'nextCommand']) assert.ok(manifest[field] !== undefined, `manifest missing ${field}`);
  const audit = AssetForge.createAuditReport(goal);
  assert.equal(Object.keys(audit.subScores).length, AssetForge.AUDIT_KEYS.length);
  const polish = AssetForge.createPolishPlan(goal);
  assert.equal(polish.stages.length, AssetForge.POLISH_STAGES.length);
  assertRoute('make premium props for anime dungeon', 'assetforge');
  assertRoute('make premium anime dungeon hub', 'premiumDirector');
  assertRoute('make a dungeon map', 'worldgen');
  assertRoute('visual critique', 'visual');
  assertRoute('generate purple sword slash vfx', 'vfx');
  assertRoute('new pairing code', 'pairing');
  assert.equal(Worldgen.createStatus().version, '0.78.0');
  assert.equal(Visual.createStatus().version, '0.78.0');
  assert.equal(Premium.createPremiumManifest('premium anime dungeon hub').version, '0.78.0');
  return {
    ok: true,
    version: AssetForge.VERSION,
    moduleCount: MODULES.length,
    styleCount: styles.length,
    assetFamilyCount: plan.assetFamilies.length,
    kitSectionCount: Object.keys(kit.sections).length,
    meshManualRequired: mesh.manualRequired,
    materialVariantCount: material.materialVariants.length,
    socketCount: sockets.sockets.length,
    auditScoreKeys: Object.keys(audit.subScores).length,
    polishStages: polish.stages.length,
    routeCategory: Router.createRoute('make premium props for anime dungeon').category,
    premiumRouteCategory: Router.createRoute('make premium anime dungeon hub').category,
    worldgenRouteCategory: Router.createRoute('make a dungeon map').category,
    visualRouteCategory: Router.createRoute('visual critique').category,
    vfxRouteCategory: Router.createRoute('generate purple sword slash vfx').category,
    pairingRouteCategory: Router.createRoute('new pairing code').category,
  };
}

module.exports = { run };
