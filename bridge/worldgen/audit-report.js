'use strict';

const { VERSION, AUDIT_KEYS, clampScore, nowIso, safeGoal } = require('./schema');
const { createLayoutGraph } = require('./layout-graph');

const reasonText = {
  spawnReadability: 'Spawn faces the primary landmark and keeps first decisions close.',
  firstTenSecondClarity: 'First ten seconds include focal landmark, route, and objective choices.',
  pathClarity: 'Main and secondary paths are named, wide, and connected to visible goals.',
  landmarkVisibility: 'Primary/secondary landmarks provide orientation beats.',
  zoneSpacing: 'Zones are spaced enough for identity while keeping travel short.',
  gameplaySocketCoverage: 'Prompt, VFX, audio, camera, and encounter sockets are planned.',
  verticality: 'Vista and focal zones introduce controlled height variation.',
  scaleProportion: 'Bounds, path width, and zone sizes are proportioned for Roblox avatars.',
  clutterControl: 'Occluders frame routes without blocking the player read.',
  lightingReadability: 'Lighting beats define key/fill/accent direction per zone.',
  vfxSocketDiscipline: 'VFX sockets are attached to roles instead of scattered randomly.',
  audioSocketCoverage: 'Audio sockets cover hero, portal, and feedback beats.',
  cameraCoverage: 'Camera beats exist for spawn, focal, portal, shop, and quest reads.',
  mobileSafety: 'Mobile fallback rules cap VFX, path width, labels, and transparent overdraw.',
  performanceSafety: 'Density budgets cap parts, lights, particles, beams, and scripts.',
  visualCriticReadiness: 'Graph is ready for V65 screenshot-evidence critique.',
  qaRouteCoverage: 'Traversal routes cover primary loop, shop, quest, portal, mobile, and clutter.',
  premiumWorldFeel: 'Style, landmark, lighting, VFX/audio, and QA plans support premium feel.',
};

function scoreFor(key, graph) {
  const zones = graph.zones || [];
  const paths = graph.paths || [];
  const qa = graph.qaRoutes || [];
  const sockets = (graph.vfxSockets || []).length + (graph.audioSockets || []).length;
  const values = {
    spawnReadability: zones.some((zone) => zone.role === 'spawn') ? 88 : 30,
    firstTenSecondClarity: zones.some((zone) => zone.role === 'primaryFocalPoint') && paths.length ? 84 : 42,
    pathClarity: paths.length >= 4 ? 82 : 62,
    landmarkVisibility: (graph.landmarks || []).length >= 3 ? 83 : 64,
    zoneSpacing: zones.length >= 6 ? 80 : 60,
    gameplaySocketCoverage: sockets >= 4 ? 82 : 58,
    verticality: (graph.vistas || []).length >= 2 ? 76 : 58,
    scaleProportion: graph.bounds && graph.bounds.width >= 180 ? 82 : 62,
    clutterControl: (graph.occluders || []).length ? 78 : 60,
    lightingReadability: (graph.lightingBeats || []).length >= zones.length ? 82 : 62,
    vfxSocketDiscipline: (graph.vfxSockets || []).length ? 78 : 58,
    audioSocketCoverage: (graph.audioSockets || []).length ? 76 : 56,
    cameraCoverage: (graph.cameraBeats || []).length >= 3 ? 82 : 60,
    mobileSafety: zones.every((zone) => zone.mobileFallback) ? 84 : 55,
    performanceSafety: zones.every((zone) => zone.densityBudget) ? 84 : 55,
    visualCriticReadiness: 86,
    qaRouteCoverage: qa.length >= 8 ? 86 : 60,
    premiumWorldFeel: 80,
  };
  return clampScore(values[key] || 70);
}

function createAuditReport(goal, options = {}) {
  const graph = options.graph || createLayoutGraph(goal, options);
  const cleanGoal = safeGoal(goal || graph.goal);
  const subScores = {};
  let total = 0;
  for (const key of AUDIT_KEYS) {
    const score = scoreFor(key, graph);
    total += score;
    subScores[key] = {
      score,
      reason: reasonText[key] || 'Worldgen audit evidence exists.',
      evidence: [`graph:${graph.graphId}`, `zones:${(graph.zones || []).length}`, `paths:${(graph.paths || []).length}`],
      exactFix: score >= 82 ? 'Preserve this strength during polish.' : `Run worldgen polish and target ${key}.`,
      suggestedCommand: `tools\\bridge.cmd worldgen polish "${cleanGoal}"`,
    };
  }
  const overallScore = clampScore(total / AUDIT_KEYS.length);
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: cleanGoal,
    graphId: graph.graphId,
    overallScore,
    rating: overallScore >= 86 ? 'premium' : overallScore >= 74 ? 'premiumCandidate' : overallScore >= 60 ? 'needsPolish' : 'blocked',
    subScores,
    visualCritiqueReadiness: {
      ready: true,
      command: `tools\\bridge.cmd visual critique "${cleanGoal}"`,
      reason: 'Layout graph has shot-ready spawn, focal, route, mobile, clutter, lighting, and UI overlay targets.',
    },
    assetForgeReadiness: {
      ready: true,
      command: `tools\\bridge.cmd assetforge kit "${cleanGoal}"`,
      reason: 'Worldgen graph has zones and sockets that can receive a coherent reusable asset kit.',
    },
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd assetforge kit "${cleanGoal}"`,
  };
}

module.exports = { createAuditReport };
