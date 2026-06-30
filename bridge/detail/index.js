'use strict';

const { AUDIT_KEYS, CAPABILITIES, POLISH_STAGES, ROOTS, SAFETY, VERSION, nowIso, safeGoal } = require('./schema');
const { getStyle, getStyleCatalog } = require('./style-catalog');
const { parseGoal } = require('./goal-parser');
const { createStatus } = require('./status');
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
const { compileForExecution, createExecutionPreview } = require('./execution-bridge');

function architectureHintsFor(goal) {
  const q = String(goal || '').toLowerCase();
  const shapeHeavy = /architecture|architectural|silhouette|modular|shape|arch|arches|roof|wall rhythm|window|door|blocky/.test(q);
  if (!shapeHeavy) return null;
  return {
    recommended: true,
    reason: 'Goal includes shape, silhouette, modular, arch, roof, wall, window, door, or blocky-geometry language. Use V91 Architecture for reusable modular grammar before or after detail density.',
    nextCommand: `tools\\bridge.cmd architecture compile "${safeGoal(goal)}"`,
  };
}

function createBuildPlan(goal, options = {}) {
  const parsed = parseGoal(goal, options);
  const style = getStyle(parsed.styleId);
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: parsed.goal,
    styleId: parsed.styleId,
    style,
    focus: parsed.focus,
    detailLevel: parsed.detailLevel,
    scale: parsed.scale,
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
    productionRules: [
      'start with large silhouette modules',
      'layer trim and bevel illusion parts after macro forms',
      'use material swatches before tiny decoration',
      'place VFX/audio/camera/prompt sockets intentionally',
      'keep mobile part/light/particle budget visible',
    ],
    warnings: [],
    blockers: [],
    architectureHints: architectureHintsFor(parsed.goal),
    nextCommand: architectureHintsFor(parsed.goal) ? `tools\\bridge.cmd architecture compile "${parsed.goal}"` : `tools\\bridge.cmd detail compile "${parsed.goal}"`,
  };
}

function createCompilePlan(goal, options = {}) {
  const compiled = compileForExecution(goal, options);
  return {
    ok: compiled.ok,
    version: VERSION,
    at: nowIso(),
    goal: compiled.goal,
    styleId: compiled.styleId,
    basePath: compiled.basePath,
    systems: compiled.systems,
    operationCount: compiled.operations.length,
    operations: compiled.operations,
    manualRequired: compiled.manualRequired,
    budget: compiled.budget,
    audit: compiled.audit,
    polishPlan: compiled.polishPlan,
    manifest: compiled.manifest,
    warnings: compiled.warnings,
    blockers: compiled.blockers,
    architectureHints: architectureHintsFor(compiled.goal),
    nextCommand: architectureHintsFor(compiled.goal) ? `tools\\bridge.cmd architecture execute-preview "${compiled.goal}"` : `tools\\bridge.cmd detail execute-preview "${compiled.goal}"`,
  };
}

function withSingleSystem(goal, systemId, compiler, options = {}) {
  const parsed = parseGoal(goal, options);
  parsed.focus = [systemId];
  const style = getStyle(parsed.styleId);
  const basePath = options.basePath || `${ROOTS.workspace}.${parsed.slug}_${systemId}_Preview`;
  const operations = compiler(parsed, style, basePath);
  const budget = createBudgetReport(parsed.goal, operations, { version: VERSION });
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: parsed.goal,
    styleId: parsed.styleId,
    system: systemId,
    basePath,
    operations,
    operationCount: operations.length,
    budget,
    warnings: budget.warnings,
    blockers: [],
    nextCommand: `tools\\bridge.cmd detail compile "${parsed.goal}"`,
  };
}

function createBudget(goal, options = {}) {
  const compiled = compileForExecution(goal, options);
  return {
    ...compiled.budget,
    version: VERSION,
    goal: safeGoal(goal),
    nextCommand: `tools\\bridge.cmd detail audit "${safeGoal(goal)}"`,
  };
}

function createAudit(goal, options = {}) {
  const compiled = compileForExecution(goal, options);
  compiled.architectureHints = architectureHintsFor(compiled.goal);
  return createAuditReport(compiled.goal, compiled);
}

function createPolish(goal, options = {}) {
  const audit = createAudit(goal, options);
  return createPolishPlan(safeGoal(goal), audit);
}

function createManifestReport(goal, options = {}) {
  const compiled = compileForExecution(goal, options);
  return createManifest(compiled.goal, {
    suffix: options.suffix || 'Preview',
    basePath: compiled.basePath,
    styleId: compiled.styleId,
    systems: compiled.systems,
    operations: compiled.operations,
    budget: compiled.budget,
    audit: compiled.audit,
    polishPlan: compiled.polishPlan,
    manualRequired: compiled.manualRequired,
    warnings: compiled.warnings,
    blockers: compiled.blockers,
  });
}

module.exports = {
  AUDIT_KEYS,
  CAPABILITIES,
  POLISH_STAGES,
  ROOTS,
  SAFETY,
  VERSION,
  createAuditReport: createAudit,
  createBuildPlan,
  createBudgetReport: createBudget,
  createCompilePlan,
  createExecutionPreview,
  createManifest: createManifestReport,
  createPolishPlan: createPolish,
  createStatus,
  createPortalPlan: (goal, options) => withSingleSystem(goal, 'portal', compilePortal, options),
  createBuildingPlan: (goal, options) => withSingleSystem(goal, 'building', compileBuilding, options),
  createInteriorPlan: (goal, options) => withSingleSystem(goal, 'interior', compileInterior, options),
  createPathPlan: (goal, options) => withSingleSystem(goal, 'path', compilePath, options),
  createPropClusterPlan: (goal, options) => withSingleSystem(goal, 'props', compilePropClusters, options),
  createLightingPlan: (goal, options) => withSingleSystem(goal, 'lighting', compileLighting, options),
  createMaterialSwatchPlan: (goal, options) => withSingleSystem(goal, 'materials', compileMaterialSwatches, options),
  createSocketPlan: (goal, options) => withSingleSystem(goal, 'sockets', compileSockets, options),
  createCollisionProxyPlan: (goal, options) => withSingleSystem(goal, 'collisionProxies', compileCollisionProxies, options),
  compileForExecution,
  getStyle,
  getStyleCatalog,
  parseGoal,
};
