'use strict';

const { AUDIT_KEYS, CAPABILITIES, POLISH_STAGES, ROOTS, SAFETY, VERSION, nowIso, safeGoal } = require('./schema');
const { createStatus } = require('./status');
const { getStyle, getStyleCatalog } = require('./style-catalog');
const { parseGoal } = require('./goal-parser');
const { createModuleGrid } = require('./module-grid');
const { createGrammarPolicy } = require('./grammar-policy');
const { createTaxonomy } = require('./architectural-taxonomy');
const { createSilhouetteGrammar } = require('./silhouette-grammar');
const { compileArchGrammar, createArchGrammar } = require('./arch-grammar');
const { compilePortalArchitecture } = require('./portal-architecture');
const { compileWallModules, createWallModulePlan } = require('./wall-modules');
const { compileRoofGrammar, createRoofGrammar } = require('./roof-grammar');
const { compileDoors, compileWindows, createWindowDoorGrammar } = require('./window-door-grammar');
const { compilePillars, createPillarGrammar } = require('./pillar-grammar');
const { compileStairs, createStairGrammar } = require('./stair-grammar');
const { compileInteriorModules, createInteriorModulePlan } = require('./interior-modules');
const { compileTrimSystem, createTrimSystem } = require('./trim-system');
const { compileDepthLayering, createDepthLayeringPlan } = require('./depth-layering');
const { createVariants } = require('./variant-generator');
const { createBudgetReport } = require('./budget');
const { createArchitectureAudit } = require('./audit-report');
const { createPolishPlan } = require('./polish-plan');
const { createManifest } = require('./manifest-store');
const { compileForExecution, createExecutionPreview } = require('./execution-bridge');

function parsedContext(goal, options = {}) {
  const parsed = parseGoal(goal, options);
  const style = getStyle(parsed.styleId);
  const moduleGrid = createModuleGrid(parsed, style);
  return { parsed, style, moduleGrid };
}

function createGrammarReport(goal, options = {}) {
  const { parsed, style, moduleGrid } = parsedContext(goal, options);
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: parsed.goal,
    styleId: parsed.styleId,
    taxonomy: createTaxonomy(),
    moduleGrid,
    silhouette: createSilhouetteGrammar(parsed, style, moduleGrid),
    grammar: createGrammarPolicy(parsed, style, moduleGrid),
    arch: createArchGrammar(parsed, style, moduleGrid),
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd architecture compile "${parsed.goal}"`,
  };
}

function createPlan(goal, options = {}) {
  const { parsed, style, moduleGrid } = parsedContext(goal, options);
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: parsed.goal,
    architectureId: parsed.slug,
    styleId: parsed.styleId,
    style,
    targetRoot: 'Workspace.CodexProduction',
    moduleGrid,
    systems: parsed.systems,
    grammar: createGrammarPolicy(parsed, style, moduleGrid),
    productionRules: ['macro silhouette before trims', 'module rhythm before decoration', 'sockets are named and intentional', 'mobile fallback is planned up front'],
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd architecture compile "${parsed.goal}"`,
  };
}

function singleSystem(goal, system, compiler, planFactory, options = {}) {
  const { parsed, style, moduleGrid } = parsedContext(goal, options);
  const basePath = options.basePath || `${ROOTS.workspace}.${parsed.slug}_${system}_Preview`;
  const operations = compiler ? compiler(parsed, style, basePath, moduleGrid) : [];
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: parsed.goal,
    styleId: parsed.styleId,
    system,
    plan: planFactory ? planFactory(parsed, style, moduleGrid) : null,
    basePath,
    operations,
    operationCount: operations.length,
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd architecture compile "${parsed.goal}"`,
  };
}

function createCompilePlan(goal, options = {}) {
  return compileForExecution(goal, options);
}

function createBudget(goal, options = {}) {
  const compiled = compileForExecution(goal, options);
  return { ...compiled.budget, nextCommand: `tools\\bridge.cmd architecture audit "${compiled.goal}"` };
}

function createAudit(goal, options = {}) {
  const compiled = compileForExecution(goal, options);
  return createArchitectureAudit(compiled.goal, compiled);
}

function createPolish(goal, options = {}) {
  const audit = createAudit(goal, options);
  return createPolishPlan(safeGoal(goal), audit);
}

function createManifestReport(goal, options = {}) {
  const compiled = compileForExecution(goal, options);
  return createManifest(compiled.goal, compiled);
}

module.exports = {
  AUDIT_KEYS,
  CAPABILITIES,
  POLISH_STAGES,
  ROOTS,
  SAFETY,
  VERSION,
  compileForExecution,
  createArchPlan: (goal, options) => singleSystem(goal, 'arch', compileArchGrammar, createArchGrammar, options),
  createAuditReport: createAudit,
  createBudgetReport: createBudget,
  createCompilePlan,
  createDoorPlan: (goal, options) => singleSystem(goal, 'doors', compileDoors, createWindowDoorGrammar, options),
  createExecutionPreview,
  createGrammarReport,
  createInteriorPlan: (goal, options) => singleSystem(goal, 'interior', compileInteriorModules, createInteriorModulePlan, options),
  createManifest: createManifestReport,
  createPillarPlan: (goal, options) => singleSystem(goal, 'pillars', compilePillars, createPillarGrammar, options),
  createPlan,
  createPolishPlan: createPolish,
  createPortalPlan: (goal, options) => singleSystem(goal, 'portal', compilePortalArchitecture, null, options),
  createRoofPlan: (goal, options) => singleSystem(goal, 'roof', compileRoofGrammar, createRoofGrammar, options),
  createStairPlan: (goal, options) => singleSystem(goal, 'stairs', compileStairs, createStairGrammar, options),
  createStatus,
  createTrimPlan: (goal, options) => singleSystem(goal, 'trims', compileTrimSystem, createTrimSystem, options),
  createVariantPlan: (goal, options) => {
    const { parsed } = parsedContext(goal, options);
    return { ok: true, version: VERSION, at: nowIso(), goal: parsed.goal, variants: createVariants(parsed), warnings: [], blockers: [], nextCommand: `tools\\bridge.cmd architecture compile "${parsed.goal}"` };
  },
  createWallPlan: (goal, options) => singleSystem(goal, 'walls', compileWallModules, createWallModulePlan, options),
  createWindowPlan: (goal, options) => singleSystem(goal, 'windows', compileWindows, createWindowDoorGrammar, options),
  getStyle,
  getStyleCatalog,
  parseGoal,
};
