'use strict';

const { STYLE_IDS } = require('./schema');

const base = {
  visualPillars: ['clear silhouette', 'premium focal hierarchy', 'readable material contrast'],
  layoutPillars: ['spawn reveal', 'main loop readability', 'landmarks every 8-12 seconds'],
  gameplayPillars: ['low-friction first objective', 'obvious rewards', 'return path to hub'],
  materialLanguage: ['clean primary material', 'accent trims', 'limited neon/glass'],
  lightingLanguage: ['key light on focal point', 'soft fill on paths', 'color-coded zones'],
  vfxLanguage: ['socketed particles only', 'hero effect at focal point', 'low mobile overdraw'],
  audioLanguage: ['ambient bed', 'UI confirmation cues', 'hero landmark loop'],
  mobileBudgetHints: ['wide paths', 'low transparent overlap', 'few dynamic lights'],
  forbiddenPatterns: ['random part scatter', 'unmarked exits', 'same-height flat plane', 'uncapped particle spam'],
};

const overrides = {
  premiumAnimeHub: {
    visualPillars: ['hero statue or portal silhouette', 'bold color bands', 'anime energy accents'],
    vfxLanguage: ['controlled aura pillars', 'portal shimmer', 'rare burst moments'],
  },
  simulatorPlaza: {
    gameplayPillars: ['spawn to core loop', 'shop/upgrades visible', 'rebirth prestige visible'],
  },
  dungeonCrawlerHub: {
    visualPillars: ['safe hub contrast against dungeon portals', 'torch depth', 'boss preview silhouette'],
    lightingLanguage: ['warm hub center', 'cool portal rims', 'deeper edges'],
  },
  bossArena: {
    layoutPillars: ['clear combat circle', 'cover rhythm', 'safe telegraph lanes'],
  },
  obbyWorld: {
    gameplayPillars: ['checkpoint cadence', 'difficulty ramp', 'readable fail zones'],
  },
  horrorFacility: {
    lightingLanguage: ['low key', 'guided contrast', 'danger silhouettes'],
    audioLanguage: ['distant machinery', 'tension risers', 'sparse stingers'],
  },
  sciFiHangar: {
    materialLanguage: ['brushed metal', 'emissive strips', 'glass terminals'],
  },
  fantasyVillage: {
    visualPillars: ['village anchor landmark', 'cozy path curvature', 'layered rooftops'],
  },
  elementalArena: {
    vfxLanguage: ['element-color quadrants', 'central fusion pulse', 'disciplined emitters'],
  },
  tycoonIsland: {
    gameplayPillars: ['claim pad clarity', 'dropper lanes', 'upgrade preview'],
  },
  socialHangout: {
    layoutPillars: ['conversation pockets', 'photo vistas', 'low-pressure loops'],
  },
  trainingGrounds: {
    gameplayPillars: ['practice stations', 'clear targets', 'reward feedback route'],
  },
  extractionZone: {
    layoutPillars: ['risk lanes', 'extraction focal point', 'cover progression'],
  },
  portalNexus: {
    visualPillars: ['portal ring hierarchy', 'destination color coding', 'central nexus beacon'],
  },
  underwaterCavern: {
    materialLanguage: ['wet stone', 'caustic light', 'bubble glass'],
    vfxLanguage: ['bubble trails', 'soft fog', 'slow shimmer'],
  },
  skyIsland: {
    visualPillars: ['floating silhouette', 'cloud depth', 'rope/bridge readability'],
  },
};

function mergeStyle(id) {
  return { id, ...base, ...(overrides[id] || {}) };
}

function getStyleCatalog() {
  return STYLE_IDS.map(mergeStyle);
}

function getStyle(styleId) {
  return getStyleCatalog().find((style) => style.id === styleId) || mergeStyle('premiumAnimeHub');
}

module.exports = { getStyle, getStyleCatalog };
