'use strict';

const { VERSION, ROOTS, REQUIRED_ZONE_ROLES, BUILD_PHASES, AUDIT_KEYS, POLISH_STAGES, TRAVERSAL_ROUTES, nowIso, safeGoal } = require('./schema');
const { getStyle, getStyleCatalog } = require('./style-catalog');
const { parseGoal } = require('./goal-parser');
const { createLayoutGraph } = require('./layout-graph');
const { createBuildPlan } = require('./build-plan');
const { createAuditReport } = require('./audit-report');
const { createPerformanceBudget } = require('./density-budget');
const { createPolishPlan } = require('./polish-plan');
const { createTraversalRoute } = require('./traversal-route');
const { createManifest, manifestPath } = require('./manifest-store');

function createStatus() {
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    status: 'ready',
    roots: ROOTS,
    capabilities: ['layout graph', 'zone planning', 'landmarks', 'paths', 'vistas', 'occluders', 'biomes', 'encounters', 'lighting zones', 'VFX/audio/camera sockets', 'mobile budgets', 'QA traversal routes', 'visual critique integration'],
    integrations: {
      premiumDirector: true,
      visualCritic: true,
      buildDirector: true,
      testPilot: true,
      cameraScreen: true,
      vfxAudio: true,
    },
    warnings: [],
    blockers: [],
    nextCommand: 'tools\\bridge.cmd worldgen plan "premium anime boss lobby"',
  };
}

function createIntentPlan(goal, options = {}) {
  const parsed = parseGoal(goal || options.goal || options.intent);
  const graph = createLayoutGraph(parsed.goal, options);
  const requiredZones = graph.zones.map((zone) => ({ id: zone.id, role: zone.role, priority: zone.priority }));
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: parsed.goal,
    styleId: parsed.styleId,
    scale: parsed.scale,
    playerFlow: parsed.playerFlow,
    requiredZones,
    requiredLandmarks: graph.landmarks.map((item) => item.id),
    requiredRoutes: graph.paths.map((item) => item.id),
    requiredSockets: [...graph.vfxSockets, ...graph.audioSockets, ...graph.cameraBeats].map((item) => item.id),
    omittedZoneRoles: graph.omissions,
    budget: createPerformanceBudget(graph),
    assetForgeRecommendation: {
      recommended: true,
      reason: 'Premium world layouts need a coherent reusable asset kit before final visual critique.',
      nextCommand: `tools\\bridge.cmd assetforge kit "${parsed.goal}"`,
    },
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd worldgen graph "${parsed.goal}"`,
  };
}

function createGenerationReport(goal, options = {}) {
  const manifest = createManifest(goal, options);
  if (options.studioConnected === false) {
    return {
      ...manifest,
      ok: false,
      status: 'manualRequired',
      warnings: [...manifest.warnings, 'Studio is not connected; worldgen returned a manifest plan without claiming Studio objects were created.'],
      nextCommand: 'tools\\bridge.cmd connect',
    };
  }
  const createdPaths = [
    manifest.workspacePath,
    manifest.manifestPath,
    manifest.premiumMirrorPath,
    `${manifest.workspacePath}.LayoutMarkers`,
    `${manifest.workspacePath}.MainPaths`,
    `${manifest.workspacePath}.Landmarks`,
    `${manifest.workspacePath}.GameplaySockets`,
    `${manifest.workspacePath}.QaRoutes`,
  ];
  return {
    ...manifest,
    status: 'codexOwnedGenerationPlan',
    createdPaths,
    warnings: manifest.warnings,
    blockers: manifest.blockers,
    assetForgeRecommendation: {
      recommended: true,
      reason: 'Generate or verify the reusable prop/material/socket kit before visual critique.',
      nextCommand: `tools\\bridge.cmd assetforge kit "${manifest.goal}"`,
    },
    nextCommand: `tools\\bridge.cmd assetforge kit "${manifest.goal}"`,
  };
}

module.exports = {
  VERSION,
  ROOTS,
  REQUIRED_ZONE_ROLES,
  BUILD_PHASES,
  AUDIT_KEYS,
  POLISH_STAGES,
  TRAVERSAL_ROUTES,
  createAuditReport,
  createBuildPlan,
  createGenerationReport,
  createIntentPlan,
  createLayoutGraph,
  createManifest,
  createPerformanceBudget,
  createPolishPlan,
  createStatus,
  createTraversalRoute,
  getStyle,
  getStyleCatalog,
  manifestPath,
  parseGoal,
  safeGoal,
};
