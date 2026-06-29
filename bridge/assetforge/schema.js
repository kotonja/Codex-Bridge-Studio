'use strict';

const VERSION = '0.74.0';

const ROOTS = {
  workspace: 'Workspace.CodexAssetForge',
  replicatedStorage: 'ReplicatedStorage.CodexAssetForge',
  premiumMirror: 'ReplicatedStorage.CodexPremiumDirector.AssetForge',
  worldgenMirror: 'ReplicatedStorage.CodexWorldgen.AssetForge',
};

const KIT_SECTIONS = [
  'focalLandmarks',
  'secondaryLandmarks',
  'pathTrim',
  'groundTiles',
  'wallModules',
  'shopModules',
  'questModules',
  'portalModules',
  'rewardModules',
  'propsSmall',
  'propsMedium',
  'signage',
  'lightingFixtures',
  'vfxSockets',
  'audioSockets',
  'collisionProxies',
  'mobileFallbacks',
];

const TAXONOMY = [
  'robloxPrimitive',
  'generatedModel',
  'kitbashModel',
  'meshNeeded',
  'materialVariantNeeded',
  'surfaceAppearanceNeeded',
  'decalNeeded',
  'textureNeeded',
  'vfxSocketOnly',
  'audioSocketOnly',
  'animationSocketOnly',
  'collisionProxyNeeded',
  'lodVariantNeeded',
  'manualExternalRequired',
];

const SOCKET_TYPES = [
  'VFX_Attachment',
  'Audio_Cue',
  'Prompt_Anchor',
  'Camera_Focus',
  'UI_Billboard',
  'Animation_Marker',
  'Loot_Spawn',
  'Enemy_Spawn',
  'Player_Path',
  'Collision_Proxy',
  'Lighting_Key',
  'Lighting_Rim',
];

const AUDIT_KEYS = [
  'styleCoherence',
  'silhouetteStrength',
  'materialCohesion',
  'bevelTrimQuality',
  'textureReadiness',
  'meshReadiness',
  'kitReusability',
  'variantCoverage',
  'socketCoverage',
  'collisionSafety',
  'lodReadiness',
  'mobileSafety',
  'performanceSafety',
  'worldgenFit',
  'visualCriticReadiness',
  'premiumAssetFeel',
  'maintainability',
];

const POLISH_STAGES = [
  'strengthen silhouettes',
  'improve material discipline',
  'add trims/bevel language',
  'reduce cheap repetition',
  'add variants',
  'add sockets',
  'add collision proxies',
  'add LOD/mobile fallback',
  'align with worldgen zones',
  'rerun visual critique',
  'rerun asset audit',
];

function nowIso() {
  return new Date().toISOString();
}

function safeGoal(goal = 'premium Roblox asset kit') {
  return String(goal || 'premium Roblox asset kit').trim().replace(/\s+/g, ' ').slice(0, 180) || 'premium Roblox asset kit';
}

function goalId(goal = 'asset kit') {
  return safeGoal(goal)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48) || 'asset_kit';
}

function hashGoal(goal = '') {
  let hash = 0;
  for (const ch of safeGoal(goal)) hash = ((hash * 31) + ch.charCodeAt(0)) >>> 0;
  return hash.toString(16).padStart(8, '0');
}

module.exports = {
  AUDIT_KEYS,
  KIT_SECTIONS,
  POLISH_STAGES,
  ROOTS,
  SOCKET_TYPES,
  TAXONOMY,
  VERSION,
  goalId,
  hashGoal,
  nowIso,
  safeGoal,
};
