'use strict';

const { ROOTS, VERSION, architectureBasePath, folder, model, safeGoal, slugify, stringValue } = require('./schema');
const { getStyle } = require('./style-catalog');
const { parseGoal } = require('./goal-parser');
const { createModuleGrid } = require('./module-grid');
const { createGrammarPolicy } = require('./grammar-policy');
const { createSilhouetteGrammar } = require('./silhouette-grammar');
const { compilePortalArchitecture } = require('./portal-architecture');
const { compileWallModules } = require('./wall-modules');
const { compileRoofGrammar } = require('./roof-grammar');
const { compileWindows, compileDoors } = require('./window-door-grammar');
const { compilePillars } = require('./pillar-grammar');
const { compileStairs } = require('./stair-grammar');
const { compileInteriorModules } = require('./interior-modules');
const { compileTrimSystem } = require('./trim-system');
const { compileDepthLayering } = require('./depth-layering');
const { createVariants } = require('./variant-generator');
const { createBudgetReport } = require('./budget');
const { createArchitectureAudit } = require('./audit-report');
const { createPolishPlan } = require('./polish-plan');
const { createManifest } = require('./manifest-store');

function buildSuffix(options = {}) {
  if (options.transactionId) return `tx_${String(options.transactionId).slice(-6)}`;
  if (options.suffix) return options.suffix;
  return 'Preview';
}

function compileOperations(parsed, style, basePath, moduleGrid) {
  const goal = parsed.goal;
  const ops = [
    folder(ROOTS.workspace, 'architectureRoot', { goal }),
    folder(ROOTS.replicatedStorage, 'architectureManifestRoot', { goal }),
    folder(ROOTS.premiumMirror, 'architecturePremiumMirror', { goal }),
    model(basePath, 'architecturePackage', { goal }),
    folder(`${basePath}.Manifests`, 'manifestFolder', { goal }),
  ];
  if (parsed.systems.portal) ops.push(...compilePortalArchitecture(parsed, style, basePath, moduleGrid));
  if (parsed.systems.walls) ops.push(...compileWallModules(parsed, style, basePath, moduleGrid));
  if (parsed.systems.roof) ops.push(...compileRoofGrammar(parsed, style, basePath, moduleGrid));
  if (parsed.systems.windows) ops.push(...compileWindows(parsed, style, basePath, moduleGrid));
  if (parsed.systems.doors) ops.push(...compileDoors(parsed, style, basePath, moduleGrid));
  if (parsed.systems.pillars) ops.push(...compilePillars(parsed, style, basePath, moduleGrid));
  if (parsed.systems.stairs) ops.push(...compileStairs(parsed, style, basePath, moduleGrid));
  if (parsed.systems.interior) ops.push(...compileInteriorModules(parsed, style, basePath, moduleGrid));
  if (parsed.systems.trims) ops.push(...compileTrimSystem(parsed, style, basePath, moduleGrid));
  if (parsed.systems.depth) ops.push(...compileDepthLayering(parsed, style, basePath, moduleGrid));
  return ops;
}

function compileForExecution(goal, options = {}) {
  const parsed = parseGoal(goal, options);
  const style = getStyle(parsed.styleId);
  const suffix = buildSuffix(options);
  const basePath = architectureBasePath(parsed.goal, suffix);
  const moduleGrid = createModuleGrid(parsed, style);
  const grammar = createGrammarPolicy(parsed, style, moduleGrid);
  const silhouette = createSilhouetteGrammar(parsed, style, moduleGrid);
  const operations = compileOperations(parsed, style, basePath, moduleGrid);
  const manualRequired = [
    { action: 'realMeshTextureOrPbrAsset', status: 'manualRequired', reason: 'V91 does not fake mesh IDs, texture IDs, PBR maps, uploads, or marketplace assets; primitive fallback operations are provided.' },
  ];
  const budget = createBudgetReport(parsed.goal, operations);
  const variants = createVariants(parsed);
  const compilePlan = {
    ok: true,
    version: VERSION,
    goal: parsed.goal,
    architectureId: `${slugify(parsed.goal, 'architecture')}_${suffix}`,
    styleId: parsed.styleId,
    targetRoot: 'Workspace.CodexProduction',
    basePath,
    moduleGrid,
    grammar,
    silhouette,
    systems: parsed.systems,
    operations,
    variants,
    budget,
    manualRequired,
    warnings: budget.warnings || [],
    blockers: [],
    sourcePlan: 'architectureCompiler',
    system: 'ArchitectureCompiler',
  };
  const audit = createArchitectureAudit(parsed.goal, compilePlan);
  const polishPlan = createPolishPlan(parsed.goal, audit);
  const manifest = createManifest(parsed.goal, { ...compilePlan, audit, polishPlan });
  const localManifestOp = stringValue(`${basePath}.Manifests.ArchitectureManifestJson`, 'architectureManifest', JSON.stringify(manifest, null, 2), { goal: parsed.goal });
  const mirrorManifestOp = stringValue(`${ROOTS.replicatedStorage}.${slugify(parsed.goal, 'architecture')}_${suffix}.ArchitectureManifestJson`, 'architectureManifestMirror', JSON.stringify(manifest, null, 2), { goal: parsed.goal });
  operations.push(localManifestOp, mirrorManifestOp);
  const finalBudget = createBudgetReport(parsed.goal, operations);
  compilePlan.budget = finalBudget;
  const finalAudit = createArchitectureAudit(parsed.goal, compilePlan);
  const finalPolishPlan = createPolishPlan(parsed.goal, finalAudit);
  const finalManifest = createManifest(parsed.goal, { ...compilePlan, audit: finalAudit, polishPlan: finalPolishPlan });
  localManifestOp.properties.Value = JSON.stringify(finalManifest, null, 2).slice(0, 199000);
  mirrorManifestOp.properties.Value = localManifestOp.properties.Value;
  return {
    ...compilePlan,
    operations,
    actions: operations,
    operationCount: operations.length,
    budget: finalBudget,
    audit: finalAudit,
    polishPlan: finalPolishPlan,
    manifest: finalManifest,
    nextCommand: `tools\\bridge.cmd architecture execute-preview "${safeGoal(parsed.goal)}"`,
  };
}

function createExecutionPreview(goal, options = {}) {
  const compiled = compileForExecution(goal, { ...options, source: 'architecture.executionPreview' });
  return {
    ok: compiled.ok,
    version: VERSION,
    goal: compiled.goal,
    status: compiled.blockers.length ? 'manualRequired' : 'previewOnly',
    executionCompatible: true,
    executionSystem: 'ArchitectureCompiler',
    sourcePlan: 'architectureCompiler',
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
    nextCommand: `tools\\bridge.cmd execute preview "${compiled.goal} architecture pass"`,
  };
}

module.exports = { compileForExecution, createExecutionPreview };
