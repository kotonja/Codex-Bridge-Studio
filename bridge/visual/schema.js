'use strict';

const VERSION = '0.71.0';

const ROOTS = {
  base: 'ReplicatedStorage.CodexPremiumDirector',
  visualCritiques: 'ReplicatedStorage.CodexPremiumDirector.VisualCritiques',
  visualEvidence: 'ReplicatedStorage.CodexPremiumDirector.VisualEvidence',
  visualPolishPlans: 'ReplicatedStorage.CodexPremiumDirector.VisualPolishPlans',
};

const SHOT_IDS = [
  'spawn_default',
  'primary_focal_point',
  'gameplay_route',
  'shop_or_upgrade_area',
  'portal_or_objective_area',
  'top_down_layout',
  'mobile_readability',
  'clutter_check',
  'lighting_depth',
  'ui_overlay',
];

const SCORE_KEYS = [
  'firstImpression',
  'focalHierarchy',
  'silhouetteReadability',
  'lightingDepth',
  'colorHarmony',
  'materialCohesion',
  'environmentalStorytelling',
  'scaleAndProportion',
  'detailDensity',
  'clutterControl',
  'vfxIntegration',
  'uiIntegration',
  'cameraComposition',
  'mobileReadability',
  'performanceRisk',
  'premiumFeel',
];

const SCORE_WEIGHTS = {
  firstImpression: 9,
  focalHierarchy: 9,
  silhouetteReadability: 8,
  lightingDepth: 8,
  colorHarmony: 7,
  materialCohesion: 7,
  environmentalStorytelling: 6,
  scaleAndProportion: 7,
  detailDensity: 7,
  clutterControl: 7,
  vfxIntegration: 6,
  uiIntegration: 5,
  cameraComposition: 7,
  mobileReadability: 7,
  performanceRisk: 7,
  premiumFeel: 10,
};

const POLISH_STAGES = [
  'composition pass',
  'lighting pass',
  'material pass',
  'silhouette pass',
  'VFX integration pass',
  'UI readability pass',
  'clutter reduction pass',
  'mobile fallback pass',
  'final screenshot pass',
];

function nowIso() {
  return new Date().toISOString();
}

function safeGoal(goal) {
  return String(goal || '').trim().replace(/\s+/g, ' ') || 'premium Roblox scene';
}

function slugify(value, fallback = 'visual_critique') {
  const slug = safeGoal(value)
    .replace(/[^0-9A-Za-z]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 56);
  return slug || fallback;
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(value) ? value : 0)));
}

function ratingFromScore(score) {
  if (score < 45) return 'blocked';
  if (score < 65) return 'rough';
  if (score < 78) return 'decent';
  if (score < 90) return 'premiumCandidate';
  return 'premium';
}

module.exports = {
  VERSION,
  ROOTS,
  SHOT_IDS,
  SCORE_KEYS,
  SCORE_WEIGHTS,
  POLISH_STAGES,
  clampScore,
  nowIso,
  ratingFromScore,
  safeGoal,
  slugify,
};
