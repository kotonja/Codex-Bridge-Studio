'use strict';

const VERSION = '0.75.0';

const ROOTS = {
  base: 'ReplicatedStorage.CodexPremiumDirector',
  manifests: 'ReplicatedStorage.CodexPremiumDirector.Manifests',
  styleBibles: 'ReplicatedStorage.CodexPremiumDirector.StyleBibles',
  assetPlans: 'ReplicatedStorage.CodexPremiumDirector.AssetPlans',
  worldPlans: 'ReplicatedStorage.CodexPremiumDirector.WorldPlans',
  buildRounds: 'ReplicatedStorage.CodexPremiumDirector.BuildRounds',
  qualityReports: 'ReplicatedStorage.CodexPremiumDirector.QualityReports',
  qaReports: 'ReplicatedStorage.CodexPremiumDirector.QaReports',
  visualCritiques: 'ReplicatedStorage.CodexPremiumDirector.VisualCritiques',
  visualEvidence: 'ReplicatedStorage.CodexPremiumDirector.VisualEvidence',
  visualPolishPlans: 'ReplicatedStorage.CodexPremiumDirector.VisualPolishPlans',
  worldgen: 'ReplicatedStorage.CodexPremiumDirector.Worldgen',
  assetForgePro: 'ReplicatedStorage.CodexPremiumDirector.AssetForge',
  cinematic: 'ReplicatedStorage.CodexPremiumDirector.Cinematic',
};

const BUILD_PHASES = [
  'blockout',
  'focal landmarks',
  'gameplay sockets',
  'lighting',
  'VFX placeholders',
  'UI prompts',
  'audio placeholders',
  'polish layer',
  'QA markers',
  'performance pass',
];

const SCORE_KEYS = [
  'styleCoherence',
  'focalHierarchy',
  'silhouetteStrength',
  'lightingDepth',
  'materialDiscipline',
  'assetDensity',
  'gameplayReadability',
  'uiReadability',
  'animationVfxSync',
  'audioReadiness',
  'performanceSafety',
  'mobileSafety',
  'playability',
  'maintainability',
  'premiumFeel',
];

const DEFAULT_WEIGHTS = {
  styleCoherence: 8,
  focalHierarchy: 8,
  silhouetteStrength: 7,
  lightingDepth: 7,
  materialDiscipline: 6,
  assetDensity: 7,
  gameplayReadability: 8,
  uiReadability: 5,
  animationVfxSync: 7,
  audioReadiness: 5,
  performanceSafety: 8,
  mobileSafety: 7,
  playability: 7,
  maintainability: 5,
  premiumFeel: 10,
};

const ASSET_CLASSES = [
  'robloxPrimitive',
  'generatedModel',
  'kitbash',
  'meshNeeded',
  'textureNeeded',
  'decalNeeded',
  'vfxOnly',
  'uiOnly',
  'animationOnly',
  'audioOnly',
  'externalManualRequired',
];

const EXTERNAL_RISK_TERMS = [
  'publish',
  'upload',
  'marketplace',
  'purchase',
  'monetization',
  'datastore',
  'data store',
  'economy save',
  'wipe',
  'delete all',
];

function safeGoal(goal) {
  return String(goal || '').trim().replace(/\s+/g, ' ') || 'premium Roblox game slice';
}

function slugify(value, fallback = 'premium_director') {
  const slug = safeGoal(value)
    .replace(/[^0-9A-Za-z]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 52);
  return slug || fallback;
}

function nowIso() {
  return new Date().toISOString();
}

function hasExternalRisk(value) {
  const text = JSON.stringify(value || '').toLowerCase();
  return EXTERNAL_RISK_TERMS.filter((term) => text.includes(term));
}

module.exports = {
  VERSION,
  ROOTS,
  BUILD_PHASES,
  SCORE_KEYS,
  DEFAULT_WEIGHTS,
  ASSET_CLASSES,
  EXTERNAL_RISK_TERMS,
  safeGoal,
  slugify,
  nowIso,
  hasExternalRisk,
};
