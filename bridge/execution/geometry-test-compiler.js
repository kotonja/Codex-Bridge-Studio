'use strict';

const { ROOTS, SYSTEMS, VERSION, nowIso, safeGoal } = require('./schema');
const { color3, normalizeOperation, summarizeSpatialSpread, vector3 } = require('./property-codec');

const TEST_GOAL = 'V92 geometry realization test';

function part(path, role, properties, index) {
  return normalizeOperation({
    type: 'part',
    className: 'Part',
    path,
    role,
    reason: `${role} verifies V92 live Size/Position/Color/Material property realization.`,
    properties: {
      Anchored: true,
      CanCollide: properties.CanCollide ?? true,
      Transparency: properties.Transparency ?? 0,
      ...properties,
    },
    attributes: {
      CodexGenerated: true,
      CodexSystem: 'GeometryRealization',
      CodexVersion: VERSION,
      CodexGeometryTest: true,
      CodexGeometryRole: role,
    },
    rollback: { action: 'deleteIfCodexGenerated', path },
    verify: { action: 'propertyLevelGeometryCheck', path },
    budgetCost: properties.budgetCost || 1,
    version: VERSION,
  }, { index });
}

function instance(path, className, role, properties = {}, index = 0) {
  return normalizeOperation({
    type: 'createInstance',
    className,
    path,
    role,
    reason: `${role} verifies V92 live non-part property realization.`,
    properties,
    attributes: {
      CodexGenerated: true,
      CodexSystem: 'GeometryRealization',
      CodexVersion: VERSION,
      CodexGeometryTest: true,
      CodexGeometryRole: role,
    },
    rollback: { action: 'deleteIfCodexGenerated', path },
    verify: { action: 'propertyLevelGeometryCheck', path },
    budgetCost: 1,
    version: VERSION,
  }, { index });
}

function compileGeometryTest(goal = TEST_GOAL, options = {}) {
  const tx = options.transactionId || 'preview';
  const suffix = String(tx).replace(/^tx_/, '').replace(/[^0-9A-Za-z_]+/g, '_').slice(-20) || 'preview';
  const base = `${ROOTS.workspace.execution}.GeometryTest_${suffix}`;
  const actions = [
    { type: 'model', className: 'Model', path: base, role: 'geometryTestRoot', reason: 'Root model for V92 geometry realization proof.' },
    part(`${base}.RedCube_Left`, 'redCubeLeft', {
      Size: vector3({ x: 4, y: 4, z: 4 }),
      Position: vector3({ x: -20, y: 4, z: 0 }),
      Color: color3({ r: 1, g: 0.05, b: 0.05 }),
      Material: 'Neon',
    }, 0),
    part(`${base}.BluePillar_Right`, 'bluePillarRight', {
      Size: vector3({ x: 3, y: 18, z: 3 }),
      Position: vector3({ x: 20, y: 9, z: 0 }),
      Color: color3({ r: 0.05, g: 0.25, b: 1 }),
      Material: 'Concrete',
    }, 1),
    part(`${base}.GreenPlatform_Forward`, 'greenPlatformForward', {
      Size: vector3({ x: 30, y: 1, z: 12 }),
      Position: vector3({ x: 0, y: 0.5, z: -30 }),
      Color: color3({ r: 0.1, g: 0.85, b: 0.2 }),
      Material: 'Grass',
    }, 2),
    part(`${base}.PurplePortal_LeftPillar`, 'purplePortalLeftPillar', {
      Size: vector3({ x: 3, y: 16, z: 3 }),
      Position: vector3({ x: -6, y: 8, z: -55 }),
      Color: color3({ r: 0.55, g: 0.08, b: 1 }),
      Material: 'Neon',
    }, 3),
    part(`${base}.PurplePortal_RightPillar`, 'purplePortalRightPillar', {
      Size: vector3({ x: 3, y: 16, z: 3 }),
      Position: vector3({ x: 6, y: 8, z: -55 }),
      Color: color3({ r: 0.55, g: 0.08, b: 1 }),
      Material: 'Neon',
    }, 4),
    part(`${base}.PurplePortal_TopBeam`, 'purplePortalTopBeam', {
      Size: vector3({ x: 15, y: 3, z: 3 }),
      Position: vector3({ x: 0, y: 16, z: -55 }),
      Color: color3({ r: 0.65, g: 0.12, b: 1 }),
      Material: 'Neon',
    }, 5),
    part(`${base}.Crystal_A`, 'crystalA', {
      Size: vector3({ x: 2, y: 5, z: 2 }),
      Position: vector3({ x: -10, y: 7, z: -50 }),
      Color: color3({ r: 0.05, g: 0.9, b: 1 }),
      Material: 'Neon',
      CanCollide: false,
    }, 6),
    part(`${base}.Crystal_B`, 'crystalB', {
      Size: vector3({ x: 2, y: 7, z: 2 }),
      Position: vector3({ x: 10, y: 8, z: -50 }),
      Color: color3({ r: 0.05, g: 0.85, b: 1 }),
      Material: 'Neon',
      CanCollide: false,
    }, 7),
    part(`${base}.PromptAnchor`, 'promptAnchor', {
      Size: vector3({ x: 2, y: 2, z: 2 }),
      Position: vector3({ x: 0, y: 2, z: -45 }),
      Color: color3({ r: 1, g: 0.85, b: 0.2 }),
      Material: 'SmoothPlastic',
      Transparency: 0.35,
      CanCollide: false,
    }, 8),
    instance(`${base}.PurplePortal_TopBeam.PortalLight`, 'PointLight', 'portalLight', {
      Brightness: 3,
      Range: 36,
      Color: color3({ r: 0.6, g: 0.2, b: 1 }),
      Shadows: true,
    }, 9),
    instance(`${base}.PromptAnchor.GeometryPrompt`, 'ProximityPrompt', 'geometryPrompt', {
      ActionText: 'Inspect',
      ObjectText: 'V92 Geometry Test',
      HoldDuration: 0,
      MaxActivationDistance: 14,
    }, 10),
  ].map((action, index) => normalizeOperation(action, { index }));

  const spread = summarizeSpatialSpread(actions);
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: safeGoal(goal || TEST_GOAL),
    system: SYSTEMS.geometryTest,
    sourcePlan: 'geometryRealizationTest',
    basePath: base,
    actions,
    manifest: {
      version: VERSION,
      goal: safeGoal(goal || TEST_GOAL),
      basePath: base,
      expectedPartCount: 9,
      expectedDistinctPositions: 9,
      expectedDistinctSizes: 8,
      spread,
    },
    warnings: [],
    blockers: [],
    manualRequiredActions: [],
    spatialSpread: spread,
    nextCommand: 'tools\\bridge.cmd geometry-test apply',
  };
}

module.exports = {
  TEST_GOAL,
  compileGeometryTest,
};
