'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Worldgen = require('./index');
const Router = require('../command-router');
const Visual = require('../visual');
const Premium = require('../premium');

const MODULES = [
  'index.js',
  'schema.js',
  'style-catalog.js',
  'goal-parser.js',
  'layout-graph.js',
  'zone-planner.js',
  'path-planner.js',
  'landmark-planner.js',
  'vista-planner.js',
  'gameplay-sockets.js',
  'biome-planner.js',
  'encounter-planner.js',
  'lighting-planner.js',
  'vfx-audio-sockets.js',
  'density-budget.js',
  'mobile-fallback.js',
  'traversal-route.js',
  'build-plan.js',
  'audit-report.js',
  'polish-plan.js',
  'manifest-store.js',
  'self-check.js',
];

function assertRoute(query, category) {
  const route = Router.createRoute(query, { version: Worldgen.VERSION });
  assert.equal(route.category, category, `${query} should route to ${category}, got ${route.category}`);
  return route;
}

function run() {
  for (const file of MODULES) {
    assert.ok(fs.existsSync(path.join(__dirname, file)), `missing worldgen module ${file}`);
  }
  const goal = 'premium anime dungeon hub';
  const status = Worldgen.createStatus();
  assert.equal(status.version, '0.78.0');
  assert.equal(status.ok, true);
  assert.equal(status.integrations.visualCritic, true);
  const styles = Worldgen.getStyleCatalog();
  assert.ok(styles.length >= 12, 'style catalog needs at least 12 styles');
  for (const style of styles) {
    for (const field of ['visualPillars', 'layoutPillars', 'gameplayPillars', 'materialLanguage', 'lightingLanguage', 'vfxLanguage', 'audioLanguage', 'mobileBudgetHints', 'forbiddenPatterns']) {
      assert.ok(Array.isArray(style[field]), `style ${style.id} missing ${field}`);
    }
  }
  const plan = Worldgen.createIntentPlan(goal);
  for (const field of ['goal', 'styleId', 'scale', 'playerFlow', 'requiredZones', 'requiredLandmarks', 'requiredRoutes', 'requiredSockets', 'budget']) {
    assert.ok(plan[field], `plan missing ${field}`);
  }
  const graph = Worldgen.createLayoutGraph(goal);
  assert.ok(Array.isArray(graph.zones) && graph.zones.length >= 6);
  assert.ok(Array.isArray(graph.paths) && graph.paths.length >= 4);
  assert.ok(Array.isArray(graph.landmarks) && graph.landmarks.length >= 3);
  assert.ok(Array.isArray(graph.vistas) && graph.vistas.length >= 2);
  assert.ok(Array.isArray(graph.vfxSockets));
  assert.ok(Array.isArray(graph.qaRoutes) && graph.qaRoutes.length >= Worldgen.TRAVERSAL_ROUTES.length);
  assert.ok(graph.zones.some((zone) => zone.role === 'spawn'), 'graph needs spawn zone');
  assert.ok(graph.zones.some((zone) => zone.role === 'primaryFocalPoint'), 'graph needs primary focal point');
  const build = Worldgen.createBuildPlan(goal, { graph });
  assert.equal(build.phases.length, Worldgen.BUILD_PHASES.length);
  const audit = Worldgen.createAuditReport(goal, { graph });
  assert.equal(Object.keys(audit.subScores).length, Worldgen.AUDIT_KEYS.length);
  const polish = Worldgen.createPolishPlan(goal, audit);
  assert.equal(polish.stages.length, Worldgen.POLISH_STAGES.length);
  const route = Worldgen.createTraversalRoute(goal, graph);
  assert.equal(route.routes.length, Worldgen.TRAVERSAL_ROUTES.length);
  const budget = Worldgen.createPerformanceBudget(graph);
  assert.ok(budget.maxPartsByZone && Object.keys(budget.maxPartsByZone).length > 0);
  assert.ok(Array.isArray(budget.mobileFallbackReductions));
  const manifest = Worldgen.createManifest(goal, { graph, audit, budget, traversal: route });
  for (const field of ['version', 'goal', 'graphId', 'warnings', 'blockers', 'nextCommand']) assert.ok(manifest[field] !== undefined, `manifest missing ${field}`);
  assertRoute('make a dungeon map', 'worldgen');
  assertRoute('make a premium anime boss lobby', 'premiumDirector');
  assertRoute('visual critique', 'visual');
  assertRoute('generate purple sword slash vfx', 'vfx');
  assertRoute('new pairing code', 'pairing');
  assert.equal(Visual.createStatus().version, '0.78.0');
  assert.equal(Premium.createPremiumManifest(goal).version, '0.78.0');
  return {
    ok: true,
    version: Worldgen.VERSION,
    moduleCount: MODULES.length,
    styleCount: styles.length,
    zoneCount: graph.zones.length,
    pathCount: graph.paths.length,
    landmarkCount: graph.landmarks.length,
    buildPhaseCount: build.phases.length,
    auditScoreKeys: Object.keys(audit.subScores).length,
    polishStages: polish.stages.length,
    traversalRoutes: route.routes.length,
    routeCategory: Router.createRoute('make a dungeon map').category,
    premiumRouteCategory: Router.createRoute('make a premium anime boss lobby').category,
    visualRouteCategory: Router.createRoute('visual critique').category,
    vfxRouteCategory: Router.createRoute('generate purple sword slash vfx').category,
    pairingRouteCategory: Router.createRoute('new pairing code').category,
  };
}

module.exports = { run };
