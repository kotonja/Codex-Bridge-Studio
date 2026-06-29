'use strict';

const RESPONSE_SCHEMA = {
  styleProfile: {
    genreGuess: 'string|null',
    mood: ['string'],
    colorPalette: ['string'],
    materialPalette: ['string'],
    shapeLanguage: ['string'],
    silhouetteRules: ['string'],
    lightingLanguage: ['string'],
    VFXLanguage: ['string'],
    robloxTranslationNotes: ['string'],
  },
  sceneUnderstanding: {
    sceneType: 'string|null',
    likelyScale: 'string|null',
    foreground: ['string'],
    midground: ['string'],
    background: ['string'],
    focalPoints: ['string'],
    majorStructures: ['string'],
    propGroups: ['string'],
    walkableAreasHypothesis: ['string'],
    blockedAreasHypothesis: ['string'],
    verticalityHypothesis: 'string|null',
    interiorExteriorGuess: 'string|null',
    gameplayUseCases: ['string'],
  },
  materialLanguage: {
    likelyMaterials: ['string'],
    surfaceFinish: ['string'],
    glow: 'string|null',
    robloxBuiltInFallbacks: ['string'],
    materialVariantSuggestions: ['string'],
    mobileFallback: ['string'],
  },
  objectCandidates: [{ name: 'string', role: 'string', confidence: 'number' }],
  layoutHypotheses: [{ name: 'string', notes: ['string'], confidence: 'number' }],
  gameplayInterpretation: {
    possiblePlayerSpawn: 'string|null',
    likelyObjective: 'string|null',
    interactionPoints: ['string'],
    traversalRoute: ['string'],
    shopPossibilities: ['string'],
    questPossibilities: ['string'],
    portalPossibilities: ['string'],
    rewardLoopIdeas: ['string'],
    cinematicMoments: ['string'],
    qaRisks: ['string'],
  },
  missingViews: [{ question: 'string', reason: 'string', importance: 'string' }],
  productionHints: {
    worldgen: ['string'],
    assetforge: ['string'],
    vfx: ['string'],
    cinematic: ['string'],
    qa: ['string'],
  },
  confidence: 'number 0..1',
  warnings: ['string'],
};

function createVisionPrompt(metadata = {}) {
  return [
    'You are Codex StudioBridge V78 analyzing a local Roblox game reference image.',
    'Return JSON only. Do not include markdown. Do not claim details you cannot see.',
    'Focus on Roblox-buildable style, scene, materials, objects, layout, gameplay, missing views, and production hints.',
    'Use concise phrases and confidence. Avoid copyrighted character identification unless the image clearly contains generic visual elements.',
    `Image metadata: ${JSON.stringify({
      extension: metadata.extension,
      byteSize: metadata.byteSize,
      dimensions: metadata.dimensions,
      fileName: metadata.fileName,
    })}`,
    `Required JSON shape: ${JSON.stringify(RESPONSE_SCHEMA)}`,
  ].join('\n');
}

function extractJsonObject(text = '') {
  const raw = String(text || '').trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(raw.slice(start, end + 1));
      } catch {
        return null;
      }
    }
  }
  return null;
}

module.exports = {
  RESPONSE_SCHEMA,
  createVisionPrompt,
  extractJsonObject,
};
