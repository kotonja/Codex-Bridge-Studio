'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const Router = require('../command-router');
const Execution = require('./index');
const { operationToStep } = require('./instance-compiler');
const { ROOTS, VERSION, isCodexPath } = require('./schema');

const REQUIRED_MODULES = [
  'index.js',
  'schema.js',
  'status.js',
  'roots.js',
  'goal-parser.js',
  'safety-policy.js',
  'transaction-store.js',
  'receipt-builder.js',
  'rollback-planner.js',
  'instance-compiler.js',
  'worldgen-compiler.js',
  'assetkit-compiler.js',
  'cinematic-compiler.js',
  'qa-marker-compiler.js',
  'polish-compiler.js',
  'safe-fix-compiler.js',
  'preview-builder.js',
  'apply-plan.js',
  'verification.js',
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
    assert.ok(fs.existsSync(path.join(moduleDir, file)), `missing execution module ${file}`);
  }
  const status = Execution.createStatus();
  assert.equal(status.version, VERSION);
  assert.ok(status.capabilities.includes('transactionReceipts'));
  assert.equal(status.safety.onlyCodexOwnedMutationsByDefault, true);
  assert.ok(ROOTS.workspace.execution);
  const roots = Execution.createRootsReport();
  assert.ok(roots.workspaceRoots.includes('Workspace.CodexExecutionKernel'));

  const preview = Execution.preview('premium anime dungeon hub');
  assert.equal(preview.status, 'previewed');
  assert.ok(preview.rootsToCreate.length);
  assert.ok(preview.actions.length);
  assert.ok(preview.rollbackPlan.length);
  assert.ok(preview.verificationPlan.length);
  assert.ok(preview.actions.every((action) => !action.path || isCodexPath(action.path)));

  const apply = Execution.apply('premium anime dungeon hub');
  assert.equal(apply.version, VERSION);
  assert.ok(apply.transaction.transactionId);
  assert.ok(['readyToApply', 'manualRequired', 'blockedExternalRisk'].includes(apply.status));
  assert.ok(apply.receipt.created.length);
  assert.ok(apply.receipt.rollbackCommand.includes(apply.transactionId));
  assert.ok(apply.receipt.verifyCommand.includes(apply.transactionId));
  assert.ok(apply.blueprint.steps.every((step) => !step.path || isCodexPath(step.path)));
  assert.ok(apply.rollbackPlan.every((item) => item.safe));
  assert.ok(apply.verification.createdPathCount > 0);

  const worldgen = Execution.worldgen('premium anime dungeon hub');
  assert.ok(worldgen.actions.some((action) => action.role === 'qaRoute' || action.path.includes('.QaRoutes.')));
  assert.ok(worldgen.actions.some((action) => action.path.includes('.Zones.')));

  const assetkit = Execution.assetkit('premium anime dungeon hub');
  assert.ok(assetkit.actions.some((action) => action.path.includes('.Families.')));
  assert.ok(assetkit.manualRequiredActions.length >= 1);

  const cinematic = Execution.cinematic('anime boss intro attack');
  assert.ok(cinematic.actions.some((action) => action.path.includes('.Camera.')));
  assert.ok(cinematic.actions.some((action) => action.path.includes('.VfxAudio.')));

  const qa = Execution.qaMarkers('premium anime dungeon hub');
  assert.ok(qa.actions.some((action) => action.path.includes('.PerformanceProbes.')));

  const namedOperationStep = operationToStep({
    type: 'createInstance',
    className: 'Sound',
    path: `${ROOTS.workspace.production}.SelfCheck.SoundCue`,
    role: 'audioSocket',
    properties: { Name: 'ShouldNotRenameReceiptPath', Volume: 0.25 },
  }, { transactionId: 'tx_self_check', goal: 'self check', system: 'ExecutionKernel' });
  assert.equal(namedOperationStep.className, 'Sound');
  assert.equal(namedOperationStep.properties.Name, undefined);
  assert.equal(namedOperationStep.properties.Volume, 0.25);

  const safeFix = Execution.safeFix('premium anime dungeon hub');
  assert.ok(safeFix.actions.every((action) => !action.path || isCodexPath(action.path)));
  const unsafe = Execution.preview('publish marketplace datastore economy update');
  assert.ok(unsafe.blockers.length >= 1 || unsafe.status === 'manualRequired');

  const receipt = Execution.receipt(apply.transactionId);
  assert.equal(receipt.ok, true);
  const verify = Execution.verify(apply.transactionId);
  assert.equal(verify.ok, true);
  const rollback = Execution.rollbackPlan(apply.transactionId);
  assert.equal(rollback.ok, true);

  checkRoute('build this for real', 'execution');
  checkRoute('apply the plan', 'execution');
  checkRoute('create it in studio', 'execution');
  checkRoute('rollback build', 'execution');
  checkRoute('show transactions', 'execution');
  checkRoute('generate purple sword slash vfx', 'vfx');
  checkRoute('new pairing code', 'pairing');
  checkRoute('make premium anime dungeon hub', 'premiumDirector');
  checkRoute('make premium props for anime dungeon', 'assetforge');
  checkRoute('make a dungeon map', 'worldgen');
  checkRoute('visual critique', 'visual');
  checkRoute('test everything', 'qa');
  checkRoute('make combat feel good', 'cinematic');
  checkRoute('remember this style', 'memory');
  checkRoute('build and test everything', 'autopilot');

  return {
    ok: true,
    version: VERSION,
    checked: [
      'modules',
      'status',
      'roots',
      'preview',
      'transaction',
      'receipt',
      'worldgen',
      'assetkit',
      'cinematic',
      'qaMarkers',
      'pathOwnedProperties',
      'safeFix',
      'rollback',
      'verification',
      'router',
    ],
    transactionId: apply.transactionId,
    warnings: [],
    blockers: [],
    nextCommand: 'tools\\bridge.cmd execute preview "premium anime dungeon hub"',
  };
}

module.exports = {
  run,
};

if (require.main === module) {
  try {
    console.log(JSON.stringify(run(), null, 2));
  } catch (err) {
    console.error(err && err.stack ? err.stack : String(err));
    process.exit(1);
  }
}
