'use strict';

const VERSION = '0.75.0';

const ROOTS = {
  workspace: 'Workspace.CodexWorldgen',
  manifests: 'ReplicatedStorage.CodexWorldgen',
  premiumMirror: 'ReplicatedStorage.CodexPremiumDirector.Worldgen',
};

const STYLE_IDS = [
  'premiumAnimeHub',
  'simulatorPlaza',
  'dungeonCrawlerHub',
  'bossArena',
  'obbyWorld',
  'horrorFacility',
  'sciFiHangar',
  'fantasyVillage',
  'elementalArena',
  'tycoonIsland',
  'socialHangout',
  'trainingGrounds',
  'extractionZone',
  'portalNexus',
  'underwaterCavern',
  'skyIsland',
];

const REQUIRED_ZONE_ROLES = [
  'spawn',
  'primaryFocalPoint',
  'shop',
  'quest',
  'portal',
  'training',
  'social',
  'reward',
  'transition',
  'vista',
  'combat',
  'bossPreview',
  'upgrade',
  'event',
  'secret',
];

const BUILD_PHASES = [
  'layout markers',
  'terrain/blockout',
  'main paths',
  'landmarks',
  'gameplay sockets',
  'shop/quest/portal staging',
  'lighting zones',
  'VFX/audio sockets',
  'UI/prompt anchors',
  'occlusion/clutter control',
  'mobile fallback pass',
  'QA route markers',
  'visual critique pass',
  'polish pass',
];

const AUDIT_KEYS = [
  'spawnReadability',
  'firstTenSecondClarity',
  'pathClarity',
  'landmarkVisibility',
  'zoneSpacing',
  'gameplaySocketCoverage',
  'verticality',
  'scaleProportion',
  'clutterControl',
  'lightingReadability',
  'vfxSocketDiscipline',
  'audioSocketCoverage',
  'cameraCoverage',
  'mobileSafety',
  'performanceSafety',
  'visualCriticReadiness',
  'qaRouteCoverage',
  'premiumWorldFeel',
];

const POLISH_STAGES = [
  'improve spawn read',
  'strengthen primary focal point',
  'simplify main path',
  'improve silhouettes',
  'deepen lighting',
  'add/discipline VFX sockets',
  'improve shop/quest/portal staging',
  'reduce clutter',
  'improve mobile fallback',
  'rerun visual critique',
  'rerun traversal QA',
];

const TRAVERSAL_ROUTES = [
  'spawn_to_primary_goal',
  'spawn_to_shop',
  'spawn_to_quest',
  'spawn_to_portal',
  'spawn_to_training',
  'full_loop',
  'mobile_readability_walk',
  'clutter_collision_sweep',
];

function nowIso() {
  return new Date().toISOString();
}

function safeGoal(goal) {
  return String(goal || '').trim().replace(/\s+/g, ' ') || 'premium Roblox world';
}

function slugify(value, fallback = 'worldgen') {
  const slug = safeGoal(value)
    .replace(/[^0-9A-Za-z]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 56);
  return slug || fallback;
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(Number(value)) ? Number(value) : 0)));
}

function vec3(x, y, z) {
  return { x, y, z };
}

module.exports = {
  VERSION,
  ROOTS,
  STYLE_IDS,
  REQUIRED_ZONE_ROLES,
  BUILD_PHASES,
  AUDIT_KEYS,
  POLISH_STAGES,
  TRAVERSAL_ROUTES,
  clampScore,
  nowIso,
  safeGoal,
  slugify,
  vec3,
};
