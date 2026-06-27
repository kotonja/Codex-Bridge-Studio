'use strict';

const VERSION = '0.69.0';

const ROOTS = {
  workspace: 'Workspace.CodexCinematicDirector',
  replicatedStorage: 'ReplicatedStorage.CodexCinematicDirector',
  premiumMirror: 'ReplicatedStorage.CodexPremiumDirector.Cinematic',
  assetForgeSockets: 'ReplicatedStorage.CodexAssetForge.CinematicSockets',
};

const STYLE_IDS = [
  'animeBossIntro',
  'animeHeavyAttack',
  'animeDashSlash',
  'magicalGirlBurst',
  'elementalUltimate',
  'simulatorRewardBurst',
  'dungeonPortalOpen',
  'bossRaidImpact',
  'horrorReveal',
  'sciFiDoorOpen',
  'cyberpunkGlitch',
  'trainingDojoCombo',
  'petSummon',
  'lootReveal',
  'obbyCheckpointVictory',
  'cinematicSpawnArrival',
  'arenaRoundStart',
  'portalTravel',
];

const BEAT_CONCEPTS = [
  'setup',
  'anticipation',
  'windup',
  'contact',
  'impact',
  'hold',
  'release',
  'followThrough',
  'recovery',
  'rewardReadability',
];

const REQUIRED_MARKERS = [
  'Start',
  'Anticipation',
  'Windup',
  'Contact',
  'Impact',
  'Release',
  'FollowThrough',
  'Recovery',
  'End',
];

const AUDIT_KEYS = [
  'timingClarity',
  'anticipationStrength',
  'poseReadability',
  'impactStrength',
  'followThroughQuality',
  'animationVfxSync',
  'audioSync',
  'cameraComposition',
  'shakeDiscipline',
  'hitStopDiscipline',
  'uiFeedback',
  'gameplayWindowClarity',
  'mobileMotionSafety',
  'performanceSafety',
  'accessibilityComfort',
  'premiumGameFeel',
  'maintainability',
];

const POLISH_STAGES = [
  'strengthen anticipation',
  'improve pose silhouette',
  'align VFX markers',
  'align audio cues',
  'improve impact frame',
  'discipline camera shake',
  'add/reduce hit-stop',
  'add UI punch feedback',
  'improve recovery/readiness',
  'mobile motion reduction',
  'rerun preview',
  'rerun audit',
];

const VFX_ROLES = ['charge', 'trail', 'flash', 'burst', 'debris', 'smoke', 'lingering aura', 'cleanup'];
const AUDIO_ROLES = ['charge_riser', 'movement_whoosh', 'impact_hit', 'bass_punch', 'magic_sparkle', 'debris', 'reward_stinger', 'ambience_duck'];

function nowIso() {
  return new Date().toISOString();
}

function safeGoal(goal = 'premium cinematic Roblox moment') {
  return String(goal || 'premium cinematic Roblox moment').trim().replace(/\s+/g, ' ').slice(0, 220) || 'premium cinematic Roblox moment';
}

function goalId(goal = 'cinematic moment') {
  return safeGoal(goal)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 54) || 'cinematic_moment';
}

function hashGoal(goal = '') {
  let hash = 0;
  for (const ch of safeGoal(goal)) hash = ((hash * 33) + ch.charCodeAt(0)) >>> 0;
  return hash.toString(16).padStart(8, '0');
}

module.exports = {
  AUDIO_ROLES,
  AUDIT_KEYS,
  BEAT_CONCEPTS,
  POLISH_STAGES,
  REQUIRED_MARKERS,
  ROOTS,
  STYLE_IDS,
  VERSION,
  VFX_ROLES,
  goalId,
  hashGoal,
  nowIso,
  safeGoal,
};
