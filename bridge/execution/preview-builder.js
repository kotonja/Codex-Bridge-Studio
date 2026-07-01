'use strict';

const { ROOTS, SYSTEMS, VERSION, allCodexRoots, nowIso, safeGoal, transactionId } = require('./schema');
const { classifyRisk } = require('./safety-policy');
const { genericOperations } = require('./instance-compiler');
const { normalizeOperation } = require('./property-codec');
const { compileWorldgen } = require('./worldgen-compiler');
const { compileAssetKit } = require('./assetkit-compiler');
const { compileDetail } = require('./detail-compiler');
const { compileArchitecture } = require('./architecture-compiler');
const { compileGeometryTest } = require('./geometry-test-compiler');
const { compileMaterials } = require('./materials-compiler');
const { compileCinematic } = require('./cinematic-compiler');
const { compileQaMarkers } = require('./qa-marker-compiler');
const { compilePolish } = require('./polish-compiler');
const { compileSafeFix } = require('./safe-fix-compiler');

function chooseCompiler(system) {
  if (system === SYSTEMS.worldgen || system === SYSTEMS.premium) return compileWorldgen;
  if (system === SYSTEMS.assetkit) return compileAssetKit;
  if (system === SYSTEMS.detail) return compileDetail;
  if (system === SYSTEMS.architecture) return compileArchitecture;
  if (system === SYSTEMS.geometryTest) return compileGeometryTest;
  if (system === SYSTEMS.materials) return compileMaterials;
  if (system === SYSTEMS.cinematic) return compileCinematic;
  if (system === SYSTEMS.qaMarkers) return compileQaMarkers;
  if (system === SYSTEMS.polish) return compilePolish;
  if (system === SYSTEMS.safeFix) return compileSafeFix;
  return null;
}

function createPreviewPlan(parsed, options = {}) {
  const tx = options.transactionId || transactionId(parsed.goal, parsed.system);
  const compiler = chooseCompiler(parsed.system);
  const compiled = compiler
    ? compiler(parsed.goal, { ...options, transactionId: tx })
    : {
      ok: true,
      version: VERSION,
      goal: safeGoal(parsed.goal),
      system: parsed.system || SYSTEMS.generic,
      sourcePlan: 'generic',
      actions: genericOperations(tx, parsed.goal, parsed.system),
      manifest: {},
      warnings: [],
      blockers: [],
    };
  const actions = (Array.isArray(compiled.actions) ? compiled.actions : [])
    .map((action, index) => normalizeOperation(action, { index, transactionId: tx, goal: parsed.goal, system: compiled.system || parsed.system }));
  const safety = classifyRisk(parsed.goal, actions);
  const rootPaths = allCodexRoots();
  const rollbackPlan = actions.filter((action) => action.path).map((action) => ({
    path: action.path,
    action: 'deleteIfCodexGenerated',
    safe: true,
    reason: 'Preview action is Codex-owned and will be receipt-backed if applied.',
  }));
  return {
    ok: safety.blockers.length === 0,
    version: VERSION,
    compilerVersion: compiled.version || VERSION,
    at: nowIso(),
    transactionId: tx,
    goal: parsed.goal,
    system: compiled.system || parsed.system || SYSTEMS.generic,
    mode: 'preview',
    status: safety.blockers.length ? 'manualRequired' : 'previewed',
    rootsToCreate: rootPaths,
    actions,
    plannedActions: actions,
    modelsToCreate: actions.filter((action) => action.className === 'Model').map((action) => action.path),
    partsAndPlaceholders: actions.filter((action) => action.className === 'Part' || action.className === 'MeshPart').map((action) => action.path),
    attachmentsAndSockets: actions.filter((action) => action.className === 'Attachment').map((action) => action.path),
    lights: actions.filter((action) => /Light$/.test(action.className || '')).map((action) => action.path),
    prompts: actions.filter((action) => action.className === 'ProximityPrompt').map((action) => action.path),
    billboards: actions.filter((action) => action.className === 'BillboardGui' || action.className === 'SurfaceGui' || action.className === 'TextLabel').map((action) => action.path),
    manifests: [`${ROOTS.replicatedStorage.manifestsRoot}.${tx}`],
    attributes: {
      CodexGenerated: true,
      CodexSystem: 'ExecutionKernel',
      CodexVersion: VERSION,
      CodexGoal: parsed.goal,
    },
    validationChecks: [
      'all paths are Codex-owned',
      'no publish/upload/marketplace/DataStore/economy mutation',
      'rollback is receipt scoped',
      'apply must return a Studio command result before execution is claimed',
    ],
    rollbackPlan,
    verificationPlan: rollbackPlan.map((item) => ({ path: item.path, verifyAction: 'existsWithReceipt' })),
    manualRequiredActions: [...(compiled.manualRequiredActions || []), ...safety.manualRequiredActions],
    blockedActions: [...(compiled.blockedActions || []), ...safety.blockers.map((reason) => ({ reason }))],
    sourcePlan: compiled.sourcePlan || 'execution',
    source: compiled,
    operationCount: actions.length,
    spatialSpread: compiled.spatialSpread || null,
    manualRequired: [...(compiled.manualRequiredActions || compiled.manualRequired || []), ...safety.manualRequiredActions],
    previewOnly: true,
    warnings: [...(compiled.warnings || []), ...safety.warnings],
    blockers: [...(compiled.blockers || []), ...safety.blockers],
    nextCommand: `tools\\bridge.cmd execute apply "${parsed.goal}"`,
  };
}

module.exports = {
  createPreviewPlan,
};
