'use strict';

const assert = require('node:assert/strict');
const Router = require('../command-router');
const Materials = require('./index');
const { VALID_ROBLOX_MATERIALS } = require('./roblox-material-map');

function routeCategory(query) {
  return Router.createRoute(query).category;
}

function run() {
  const goal = 'dark purple anime dungeon gate';
  const status = Materials.createStatus();
  assert.equal(status.ok, true);
  assert.equal(status.version, '0.93.0');
  assert.equal(status.safety.codexOwnedOnly, true);

  const styles = Materials.createStyleCatalog();
  assert.ok(styles.styleCount >= 12);
  for (const style of styles.styles) {
    assert.ok(Array.isArray(style.basePalette));
    assert.ok(Array.isArray(style.accentPalette));
    assert.ok(Array.isArray(style.materialPalette));
    assert.ok(style.glowRules);
    assert.ok(style.trimContrastRules);
    assert.ok(style.lightingLanguage);
    assert.ok(style.atmosphereLanguage);
  }

  const palette = Materials.createPalette(goal);
  assert.equal(palette.ok, true);
  assert.ok(palette.baseColors.length);
  assert.ok(palette.accentColors.length);
  assert.ok(palette.emissiveColors.length);
  assert.ok(palette.materials.length >= 10);
  for (const material of palette.materials) {
    assert.ok(VALID_ROBLOX_MATERIALS.includes(material.robloxMaterial), `${material.robloxMaterial} is not a valid built-in material`);
  }
  assert.ok(palette.manualRequired.some((item) => item.action === 'surfaceAppearancePbrAssets'));

  const swatches = Materials.createSwatchPlan(goal);
  assert.equal(swatches.ok, true);
  assert.ok(swatches.operations.length >= 16);
  assert.ok(swatches.operations.every((op) => /^Workspace\.Codex/.test(op.path)));

  const lighting = Materials.createLightingPlan(goal);
  assert.ok(lighting.mobileReduction.length);
  assert.ok(lighting.brightnessLimits.pointLightMax <= 1.8);

  const atmosphere = Materials.createAtmospherePlan(goal);
  assert.equal(atmosphere.readOnlyByDefault, true);
  assert.ok(atmosphere.manualRequired.some((item) => item.action === 'globalLightingAtmosphereApply'));

  const fixtures = Materials.createLightFixturePlan(goal);
  assert.ok(fixtures.operationCount >= 8);
  assert.ok(fixtures.budget.withinBudget);

  const glow = Materials.createGlowAccentPlan(goal);
  assert.ok(glow.operationCount >= 5);

  const budget = Materials.createMaterialMobileBudget(goal);
  assert.equal(budget.maxLightsMobile, 8);

  const audit = Materials.createAuditReport(goal);
  for (const key of Materials.AUDIT_KEYS) assert.ok(Object.prototype.hasOwnProperty.call(audit.scores, key), `missing audit score ${key}`);

  const polish = Materials.createPolishPlan(goal);
  assert.ok(polish.stages.length >= 9);

  const preview = Materials.createExecutionPreview(goal);
  assert.equal(preview.executionCompatible, true);
  assert.ok(preview.actions.length >= 25);
  assert.ok(preview.actions.every((op) => /^Workspace\.Codex|^ReplicatedStorage\.Codex/.test(op.path)));
  assert.ok(preview.manualRequired.some((item) => /SurfaceAppearance|PBR|pbr/i.test(`${item.action} ${item.reason}`)));
  assert.ok(!JSON.stringify(preview).includes('rbxassetid://'));

  const routes = {
    'improve materials': 'materials',
    'make materials premium': 'materials',
    'fix plain parts': 'materials',
    'improve colors': 'materials',
    'add material palette': 'materials',
    'add material swatches': 'materials',
    'lighting pass': 'materials',
    'make lighting better': 'materials',
    'mood lighting': 'materials',
    'add atmosphere': 'materials',
    'add fog': 'materials',
    'make it less plain': 'materials',
    'make parts look premium': 'materials',
    'make better shapes': 'architecture',
    'make it less placeholder': 'detail',
    'make premium props for anime dungeon': 'assetforge',
    'build this for real': 'execution',
    'new pairing code': 'pairing',
  };
  for (const [query, expected] of Object.entries(routes)) assert.equal(routeCategory(query), expected, `route ${query}`);

  return {
    ok: true,
    version: Materials.VERSION,
    checked: {
      styles: styles.styleCount,
      paletteRoles: palette.materials.length,
      swatchOperations: swatches.operations.length,
      previewOperations: preview.actions.length,
      auditKeys: Materials.AUDIT_KEYS.length,
      polishStages: polish.stages.length,
      routes: Object.keys(routes).length,
    },
    warnings: [],
    blockers: [],
    nextCommand: 'tools\\bridge.cmd materials execute-preview "dark purple anime dungeon gate"',
  };
}

module.exports = {
  run,
};
