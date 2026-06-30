'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const Router = require('../command-router');
const Architecture = require('./index');
const { AUDIT_KEYS, VERSION } = require('./schema');

const REQUIRED_MODULES = [
  'index.js',
  'schema.js',
  'status.js',
  'style-catalog.js',
  'goal-parser.js',
  'grammar-policy.js',
  'architectural-taxonomy.js',
  'silhouette-grammar.js',
  'module-grid.js',
  'arch-grammar.js',
  'portal-architecture.js',
  'wall-modules.js',
  'roof-grammar.js',
  'window-door-grammar.js',
  'pillar-grammar.js',
  'stair-grammar.js',
  'interior-modules.js',
  'trim-system.js',
  'depth-layering.js',
  'variant-generator.js',
  'budget.js',
  'execution-bridge.js',
  'audit-report.js',
  'polish-plan.js',
  'manifest-store.js',
  'self-check.js',
];

function checkRoute(query, category) {
  const route = Router.createRoute(query);
  assert.equal(route.category, category, `${query} routed to ${route.category}, expected ${category}`);
}

function run() {
  const moduleDir = __dirname;
  for (const file of REQUIRED_MODULES) {
    assert.ok(fs.existsSync(path.join(moduleDir, file)), `missing architecture module ${file}`);
  }
  const status = Architecture.createStatus();
  assert.equal(status.version, VERSION);
  assert.equal(status.ok, true);
  assert.ok(status.capabilities.includes('silhouetteGrammar'));
  assert.equal(status.safety.codexOwnedOnly, true);

  const styles = Architecture.getStyleCatalog();
  assert.ok(styles.length >= 12);
  for (const style of styles) {
    for (const key of ['silhouetteLanguage', 'moduleGrid', 'archRules', 'wallRules', 'roofRules', 'windowDoorRules', 'pillarRules', 'trimRules', 'depthRules', 'forbiddenCheapPatterns', 'mobileBudgetHints']) {
      assert.ok(style[key], `style ${style.id} missing ${key}`);
    }
  }

  const goal = 'dark purple anime dungeon gate';
  const grammar = Architecture.createGrammarReport(goal);
  for (const key of ['baseModuleSize', 'verticalModuleSize', 'wallBayRules', 'cornerRules', 'archProportions', 'pillarSpacing', 'trimBands', 'roofUpperSilhouette', 'doorWindowRhythm', 'depthLayers', 'socketAnchorRules', 'collisionClearance']) {
    assert.ok(grammar.grammar[key], `grammar missing ${key}`);
  }

  const compile = Architecture.createCompilePlan(goal);
  assert.equal(compile.version, VERSION);
  assert.ok(compile.operationCount > 30);
  assert.ok(compile.operations.every((op) => op.op && op.path && op.className && op.role && op.properties && op.attributes && op.rollback && op.verify && op.budgetCost !== undefined));
  assert.ok(compile.manualRequired.some((item) => /mesh|texture|pbr/i.test(item.action + item.reason)));
  assert.ok(compile.operations.some((op) => op.role === 'basePlinth'));
  assert.ok(compile.operations.some((op) => op.role === 'sidePillar'));
  assert.ok(compile.operations.some((op) => op.role === 'archSegment'));
  assert.ok(compile.operations.some((op) => op.role === 'keystone'));
  assert.ok(compile.operations.some((op) => op.role === 'depthLayerBackRim' || op.role === 'depthLayerFrontTrim'));
  assert.ok(compile.operations.some((op) => op.role === 'floatingCrystalAnchor'));
  assert.ok(compile.operations.some((op) => op.role === 'vfxSocket'));
  assert.ok(compile.operations.some((op) => op.role === 'collisionProxy'));

  for (const report of [
    Architecture.createPortalPlan(goal),
    Architecture.createArchPlan(goal),
    Architecture.createWallPlan(goal),
    Architecture.createRoofPlan(goal),
    Architecture.createWindowPlan(goal),
    Architecture.createDoorPlan(goal),
    Architecture.createPillarPlan(goal),
    Architecture.createStairPlan(goal),
    Architecture.createInteriorPlan(goal),
    Architecture.createTrimPlan(goal),
  ]) {
    assert.equal(report.ok, true);
  }
  assert.ok(Architecture.createVariantPlan(goal).variants.length >= 3);
  assert.ok(compile.budget.operationCount === compile.operations.length);

  const audit = Architecture.createAuditReport(goal);
  for (const key of AUDIT_KEYS) assert.ok(audit.scores[key] !== undefined, `audit missing ${key}`);
  assert.ok(audit.overallScore > 0);
  assert.ok(Architecture.createPolishPlan(goal).stages.length >= 11);
  assert.equal(Architecture.createExecutionPreview(goal).executionCompatible, true);
  assert.ok(Architecture.createManifest(goal).operationCount > 0);

  for (const query of [
    'make better shapes',
    'improve silhouette',
    'advanced shape grammar',
    'modular architecture',
    'make the architecture better',
    'better portal shape',
    'make better arches',
    'improve roof shape',
    'make walls modular',
    'make it look less blocky',
    'fix blocky geometry',
  ]) checkRoute(query, 'architecture');
  checkRoute('make it less placeholder', 'detail');
  checkRoute('add more detail', 'detail');
  checkRoute('make premium props for anime dungeon', 'assetforge');
  checkRoute('build this for real', 'execution');
  checkRoute('new pairing code', 'pairing');

  return {
    ok: true,
    version: VERSION,
    checked: ['modules', 'status', 'styles', 'grammar', 'compile', 'portal', 'walls', 'roof', 'windowsDoors', 'pillars', 'stairs', 'interior', 'trims', 'variants', 'budget', 'audit', 'polish', 'executionPreview', 'manifest', 'router'],
    styleCount: styles.length,
    operationCount: compile.operations.length,
    auditScore: audit.overallScore,
    warnings: [],
    blockers: [],
    nextCommand: 'tools\\bridge.cmd architecture compile "dark purple anime dungeon gate"',
  };
}

module.exports = { run };

if (require.main === module) {
  try {
    console.log(JSON.stringify(run(), null, 2));
  } catch (err) {
    console.error(err && err.stack ? err.stack : String(err));
    process.exit(1);
  }
}
