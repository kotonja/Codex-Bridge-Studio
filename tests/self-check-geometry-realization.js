'use strict';

const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const Execution = require('../bridge/execution');
const Detail = require('../bridge/detail');
const Architecture = require('../bridge/architecture');
const { normalizeOperation, summarizeSpatialSpread } = require('../bridge/execution/property-codec');

function partActions(actions) {
  return (actions || []).filter((action) => action.className === 'Part' || action.className === 'MeshPart');
}

function assertTypedGeometry(action, label) {
  assert.ok(action, `${label} action missing`);
  assert.equal(action.properties.Size.__type, 'Vector3', `${label} Size must be typed Vector3`);
  assert.equal(action.properties.Position.__type, 'Vector3', `${label} Position must be typed Vector3`);
  assert.equal(action.properties.Color.__type, 'Color3', `${label} Color must be typed Color3`);
  assert.ok(action.properties.Material, `${label} Material missing`);
  assert.equal(typeof action.properties.Anchored, 'boolean', `${label} Anchored missing`);
  assert.equal(typeof action.properties.CanCollide, 'boolean', `${label} CanCollide missing`);
  assert.ok(action.expectedProperties && action.expectedProperties.Size, `${label} expected Size missing`);
  assert.ok(action.expectedProperties && action.expectedProperties.Position, `${label} expected Position missing`);
}

function assertSpread(actions, label, minPositions, minSizes) {
  const normalized = (actions || []).map((action, index) => normalizeOperation(action, { index, goal: label }));
  const spread = summarizeSpatialSpread(normalized);
  assert.ok(spread.partCount > 0, `${label} must include parts`);
  assert.ok(spread.allPartsHavePosition, `${label} parts must all have position or cframe`);
  assert.ok(spread.allPartsHaveSize, `${label} parts must all have size`);
  assert.ok(spread.distinctPositionCount >= minPositions, `${label} positions collapsed: ${spread.distinctPositionCount}`);
  assert.ok(spread.distinctSizeCount >= minSizes, `${label} sizes collapsed: ${spread.distinctSizeCount}`);
  return spread;
}

function run() {
  const geometryPreview = Execution.geometryTest();
  assert.equal(geometryPreview.ok, true);
  assert.equal(geometryPreview.system, 'GeometryRealization');
  assert.ok(geometryPreview.actions.length >= 11);

  const red = geometryPreview.actions.find((action) => action.path.endsWith('.RedCube_Left'));
  const blue = geometryPreview.actions.find((action) => action.path.endsWith('.BluePillar_Right'));
  const platform = geometryPreview.actions.find((action) => action.path.endsWith('.GreenPlatform_Forward'));
  assertTypedGeometry(red, 'RedCube_Left');
  assertTypedGeometry(blue, 'BluePillar_Right');
  assertTypedGeometry(platform, 'GreenPlatform_Forward');
  assert.equal(red.properties.Size.x, 4);
  assert.equal(red.properties.Position.x, -20);
  assert.equal(blue.properties.Size.y, 18);
  assert.equal(platform.properties.Position.z, -30);

  const geometrySpread = assertSpread(geometryPreview.actions, 'geometry-test', 9, 7);
  const applyPlan = Execution.createApplyPlan('V92 geometry realization test', { system: Execution.SYSTEMS.geometryTest });
  assert.equal(applyPlan.ok, true);
  assert.ok(applyPlan.blueprint && applyPlan.blueprint.steps.length > 0);
  const redStep = applyPlan.blueprint.steps.find((step) => step.path && step.path.endsWith('.RedCube_Left'));
  assertTypedGeometry(redStep, 'RedCube_Left blueprint');
  const redReceipt = applyPlan.receipt.created.find((item) => item.path.endsWith('.RedCube_Left'));
  assert.ok(redReceipt.expectedProperties.Size, 'Receipt must preserve expected Size');
  assert.ok(redReceipt.expectedProperties.Position, 'Receipt must preserve expected Position');
  assert.equal(applyPlan.verification.propertyVerificationContract.checksSize, true);
  assert.equal(applyPlan.verification.propertyVerificationContract.checksPosition, true);
  assert.equal(applyPlan.verification.propertyVerificationContract.checksColor, true);
  assert.equal(applyPlan.verification.propertyVerificationContract.checksMaterial, true);
  assert.ok(applyPlan.rollbackPlan.every((item) => item.safe), 'Rollback must only target safe Codex-owned paths');

  const detailPortal = Detail.createPortalPlan('dark purple anime dungeon gate');
  const detailSpread = assertSpread(detailPortal.operations, 'detail portal', 8, 5);
  const architecturePortal = Architecture.createPortalPlan('dark purple anime dungeon gate');
  const architectureSpread = assertSpread(architecturePortal.operations, 'architecture portal', 10, 6);

  const noBom = JSON.parse(childProcess.execFileSync(process.execPath, ['scripts/check-no-bom.js'], { encoding: 'utf8' }));
  assert.equal(noBom.ok, true);

  return {
    ok: true,
    version: Execution.VERSION,
    checked: [
      'geometryTestPlan',
      'typedSizePositionColorMaterial',
      'executionPreviewPreservesTransformData',
      'receiptExpectedProperties',
      'propertyVerificationContract',
      'rollbackCodexGeneratedOnly',
      'detailPortalSpatialSpread',
      'architecturePortalSpatialSpread',
      'noBom',
    ],
    geometrySpread,
    detailPortalSpread: detailSpread,
    architecturePortalSpread: architectureSpread,
    warnings: [],
    blockers: [],
    nextCommand: 'tools\\bridge.cmd geometry-test preview',
  };
}

if (require.main === module) {
  try {
    console.log(JSON.stringify(run(), null, 2));
  } catch (error) {
    console.error(JSON.stringify({
      ok: false,
      version: Execution.VERSION,
      error: error && error.stack ? error.stack : String(error),
      nextCommand: 'node tests/self-check-geometry-realization.js',
    }, null, 2));
    process.exit(1);
  }
}

module.exports = { run };
