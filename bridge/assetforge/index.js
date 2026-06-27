'use strict';

const { AUDIT_KEYS, KIT_SECTIONS, POLISH_STAGES, ROOTS, SOCKET_TYPES, TAXONOMY, VERSION, nowIso, safeGoal } = require('./schema');
const { getStyle, getStyleCatalog } = require('./style-catalog');
const { parseGoal } = require('./goal-parser');
const { createKitPlan } = require('./kit-planner');
const { createKitbashPlan } = require('./kitbash-planner');
const { createMeshPlan } = require('./mesh-planner');
const { createMaterialPlan } = require('./material-planner');
const { createDecalSignagePlan } = require('./decal-signage-plan');
const { createSocketPlan } = require('./socket-planner');
const { createCollisionPlan } = require('./collision-planner');
const { createLodPlan } = require('./lod-planner');
const { createMobileBudget } = require('./mobile-budget');
const { createLibraryReport } = require('./library-scanner');
const { rankReuse } = require('./reuse-ranker');
const { createBuildPlan } = require('./build-plan');
const { createAuditReport } = require('./audit-report');
const { createPolishPlan } = require('./polish-plan');
const { createManifest, manifestPath } = require('./manifest-store');

function parsedWithVersion(goal) {
  const parsed = parseGoal(goal);
  parsed.version = VERSION;
  return parsed;
}

function createStatus() {
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    status: 'ready',
    roots: ROOTS,
    capabilities: [
      'assetTaxonomy',
      'styleCatalog',
      'kitPlanning',
      'kitbashPlanning',
      'meshNeedDetection',
      'materialVariantPlanning',
      'surfaceAppearancePlanning',
      'decalSignagePlanning',
      'socketPlanning',
      'collisionProxyPlanning',
      'lodMobileFallback',
      'libraryScanning',
      'qualityAudit',
      'premiumIntegration',
      'worldgenIntegration',
      'visualCriticIntegration',
    ],
    integrations: { premiumDirector: true, worldgen: true, visualCritic: true, buildDirector: true, vfx: true, audio: true, animation: true },
    warnings: [],
    blockers: [],
    nextCommand: 'tools\\bridge.cmd assetforge plan "premium anime dungeon hub asset kit"',
  };
}

function createIntentPlan(goal, options = {}) {
  const parsed = parsedWithVersion(goal || options.goal || options.intent);
  const style = getStyle(parsed.styleId);
  const kitPlan = createKitPlan(parsed, style);
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: parsed.goal,
    styleId: parsed.styleId,
    assetKitId: parsed.assetKitId,
    assetFamilies: kitPlan.assetFamilies,
    requiredManifests: kitPlan.requiredManifests,
    taxonomyCatalog: TAXONOMY,
    worldgenIntegration: { recommended: true, command: `tools\\bridge.cmd worldgen graph "${parsed.goal}"` },
    visualCriticIntegration: { recommended: true, command: `tools\\bridge.cmd visual critique "${parsed.goal}"` },
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd assetforge kit "${parsed.goal}"`,
  };
}

function createKitReport(goal) {
  const parsed = parsedWithVersion(goal);
  return createKitPlan(parsed, getStyle(parsed.styleId));
}

function createMeshReport(goal) {
  const kit = createKitReport(goal);
  return { ...createMeshPlan(kit.goal, kit.assetFamilies, getStyle(kit.styleId)), version: VERSION, assetKitId: kit.assetKitId };
}

function createMaterialReport(goal) {
  const kit = createKitReport(goal);
  return { ...createMaterialPlan(kit.goal, kit.assetFamilies, getStyle(kit.styleId)), version: VERSION, assetKitId: kit.assetKitId };
}

function createSocketReport(goal) {
  const kit = createKitReport(goal);
  return { ...createSocketPlan(kit.goal, { familyId: kit.assetKitId }), version: VERSION, assetKitId: kit.assetKitId };
}

function createBudgetReport(goal) {
  const kit = createKitReport(goal);
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: kit.goal,
    assetKitId: kit.assetKitId,
    budget: createMobileBudget(kit.assetFamilies),
    lodPlan: createLodPlan(kit.assetFamilies),
    collisionPlan: createCollisionPlan(kit.assetFamilies),
    reuseRanking: rankReuse(kit.assetFamilies),
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd assetforge audit "${kit.goal}"`,
  };
}

function createAudit(goal) {
  const kit = createKitReport(goal);
  return createAuditReport(kit.goal, kit);
}

function createPolish(goal) {
  const kit = createKitReport(goal);
  const audit = createAuditReport(kit.goal, kit);
  return createPolishPlan(kit.goal, kit, audit);
}

function createManifestReport(goal, options = {}) {
  const kit = createKitReport(goal);
  const meshPlan = createMeshReport(kit.goal);
  const materialPlan = createMaterialReport(kit.goal);
  const socketPlan = createSocketReport(kit.goal);
  const budget = createBudgetReport(kit.goal);
  const audit = createAuditReport(kit.goal, kit);
  const polishPlan = createPolishPlan(kit.goal, kit, audit);
  return createManifest(kit.goal, {
    assetKitId: kit.assetKitId,
    plan: createIntentPlan(kit.goal),
    kitPlan: kit,
    meshPlan,
    materialPlan,
    socketPlan,
    budget,
    audit,
    polishPlan,
    warnings: options.warnings || [],
    blockers: options.blockers || [],
  });
}

function createGenerationReport(goal, options = {}) {
  const manifest = createManifestReport(safeGoal(goal), options);
  if (options.studioConnected === false) {
    return {
      ...manifest,
      ok: false,
      status: 'manualRequired',
      warnings: [...manifest.warnings, 'Studio is not connected; Asset Forge returned a manifest/spec plan without claiming Studio objects were created.'],
      nextCommand: 'tools\\bridge.cmd connect',
    };
  }
  return {
    ...manifest,
    status: 'codexOwnedGenerationPlan',
    createdPaths: [
      manifest.workspacePath,
      manifest.manifestPath,
      manifest.premiumMirrorPath,
      manifest.worldgenMirrorPath,
      `${manifest.workspacePath}.Families`,
      `${manifest.workspacePath}.Sockets`,
      `${manifest.workspacePath}.CollisionProxies`,
      `${manifest.workspacePath}.MobileFallbacks`,
    ],
    attributes: {
      CodexGenerated: true,
      CodexSystem: 'AssetForge',
      CodexVersion: VERSION,
      CodexGoal: manifest.goal,
      CodexAssetFamily: manifest.assetKitId,
      CodexAssetRole: 'assetKit',
    },
    warnings: manifest.warnings,
    blockers: manifest.blockers,
    nextCommand: `tools\\bridge.cmd visual critique "${manifest.goal}"`,
  };
}

function createLibraryScan(rootPath, options = {}) {
  return createLibraryReport(rootPath, { ...options, version: VERSION });
}

module.exports = {
  AUDIT_KEYS,
  KIT_SECTIONS,
  POLISH_STAGES,
  ROOTS,
  SOCKET_TYPES,
  TAXONOMY,
  VERSION,
  createAuditReport: createAudit,
  createBudgetReport,
  createDecalSignagePlan,
  createGenerationReport,
  createIntentPlan,
  createKitPlan: createKitReport,
  createKitbashPlan,
  createLibraryReport: createLibraryScan,
  createManifest: createManifestReport,
  createMaterialPlan: createMaterialReport,
  createMeshPlan: createMeshReport,
  createPolishPlan: createPolish,
  createSocketPlan: createSocketReport,
  createStatus,
  getStyle,
  getStyleCatalog,
  manifestPath,
  parseGoal,
};
