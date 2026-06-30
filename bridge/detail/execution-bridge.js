'use strict';

const { ROOTS, VERSION, detailBasePath, safeGoal, slugify } = require('./schema');
const { getStyle } = require('./style-catalog');
const { parseGoal } = require('./goal-parser');
const { folder, model, stringValue } = require('./part-grammar');
const { createPolicyReport } = require('./detail-policy');
const { compilePortal } = require('./portal-compiler');
const { compileBuilding } = require('./building-compiler');
const { compileInterior } = require('./interior-compiler');
const { compilePath } = require('./path-compiler');
const { compilePropClusters } = require('./prop-cluster-compiler');
const { compileLighting } = require('./lighting-fixture-compiler');
const { compileMaterialSwatches } = require('./material-swatch-compiler');
const { compileSockets } = require('./socket-compiler');
const { compileCollisionProxies } = require('./collision-proxy-compiler');
const { createBudgetReport } = require('./density-budget');
const { createAuditReport } = require('./audit-report');
const { createPolishPlan } = require('./polish-plan');
const { createManifest } = require('./manifest-store');

function buildSuffix(options = {}) {
  if (options.transactionId) return `tx_${String(options.transactionId).slice(-6)}`;
  if (options.suffix) return options.suffix;
  return 'Preview';
}

function compileOperations(parsed, style, basePath) {
  const goal = parsed.goal;
  const ops = [
    folder(ROOTS.workspace, 'detailRoot', { goal }),
    folder(ROOTS.replicatedStorage, 'detailManifestRoot', { goal }),
    folder(ROOTS.premiumMirror, 'detailPremiumMirror', { goal }),
    model(basePath, 'detailPackage', { goal }),
    folder(`${basePath}.Manifests`, 'manifestFolder', { goal }),
  ];
  if (parsed.focus.includes('portal')) ops.push(...compilePortal(parsed, style, basePath));
  if (parsed.focus.includes('building')) ops.push(...compileBuilding(parsed, style, basePath));
  if (parsed.focus.includes('interior')) ops.push(...compileInterior(parsed, style, basePath));
  if (parsed.focus.includes('path')) ops.push(...compilePath(parsed, style, basePath));
  if (parsed.focus.includes('props')) ops.push(...compilePropClusters(parsed, style, basePath));
  if (parsed.focus.includes('lighting')) ops.push(...compileLighting(parsed, style, basePath));
  if (parsed.focus.includes('materials')) ops.push(...compileMaterialSwatches(parsed, style, basePath));
  if (parsed.focus.includes('sockets')) ops.push(...compileSockets(parsed, style, basePath));
  ops.push(...compileCollisionProxies(parsed, style, basePath));
  return ops;
}

function compileForExecution(goal, options = {}) {
  const parsed = parseGoal(goal, options);
  const style = getStyle(parsed.styleId);
  const suffix = buildSuffix(options);
  const basePath = detailBasePath(parsed.goal, suffix);
  const policy = createPolicyReport(parsed.goal);
  const operations = compileOperations(parsed, style, basePath);
  const budget = createBudgetReport(parsed.goal, operations, { version: VERSION });
  const compilePlan = {
    ok: policy.blockers.length === 0,
    version: VERSION,
    goal: parsed.goal,
    styleId: parsed.styleId,
    basePath,
    systems: {
      portal: parsed.focus.includes('portal'),
      building: parsed.focus.includes('building'),
      interior: parsed.focus.includes('interior'),
      path: parsed.focus.includes('path'),
      props: parsed.focus.includes('props'),
      lighting: parsed.focus.includes('lighting'),
      materials: parsed.focus.includes('materials'),
      sockets: parsed.focus.includes('sockets'),
      collisionProxies: true,
    },
    operations,
    manualRequired: [
      ...policy.manualRequired,
      { action: 'realMeshOrTextureImport', status: 'manualRequired', reason: 'V89 does not fake mesh IDs, texture IDs, uploads, or marketplace assets.' },
    ],
    budget,
    warnings: [...budget.warnings],
    blockers: [...policy.blockers],
  };
  const audit = createAuditReport(parsed.goal, compilePlan);
  const polishPlan = createPolishPlan(parsed.goal, audit);
  const manifest = createManifest(parsed.goal, {
    suffix,
    basePath,
    styleId: parsed.styleId,
    systems: compilePlan.systems,
    operations,
    budget,
    audit,
    polishPlan,
    manualRequired: compilePlan.manualRequired,
    warnings: compilePlan.warnings,
    blockers: compilePlan.blockers,
  });
  operations.push(stringValue(`${basePath}.Manifests.DetailManifestJson`, 'detailManifest', JSON.stringify(manifest, null, 2), { goal: parsed.goal }));
  operations.push(stringValue(`${ROOTS.replicatedStorage}.${slugify(parsed.goal, 'detail')}_${suffix}.DetailManifestJson`, 'detailManifestMirror', JSON.stringify(manifest, null, 2), { goal: parsed.goal }));

  return {
    ...compilePlan,
    operations,
    actions: operations,
    audit,
    polishPlan,
    manifest,
    sourcePlan: 'detailCompiler',
    system: 'DetailCompiler',
    nextCommand: `tools\\bridge.cmd detail execute-preview "${safeGoal(parsed.goal)}"`,
  };
}

function createExecutionPreview(goal, options = {}) {
  const compiled = compileForExecution(goal, { ...options, source: 'detail.executionPreview' });
  return {
    ok: compiled.ok,
    version: VERSION,
    goal: compiled.goal,
    status: compiled.blockers.length ? 'manualRequired' : 'previewOnly',
    executionCompatible: true,
    executionSystem: 'DetailCompiler',
    sourcePlan: 'detailCompiler',
    preview: {
      actionCount: compiled.operations.length,
      basePath: compiled.basePath,
      systems: compiled.systems,
      budget: compiled.budget,
      auditScore: compiled.audit.overallScore,
    },
    actions: compiled.operations,
    operations: compiled.operations,
    manualRequired: compiled.manualRequired,
    warnings: compiled.warnings,
    blockers: compiled.blockers,
    nextCommand: `tools\\bridge.cmd execute preview "${compiled.goal} detail pass"`,
  };
}

module.exports = {
  compileForExecution,
  createExecutionPreview,
};
