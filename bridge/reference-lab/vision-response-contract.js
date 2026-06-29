'use strict';

const { VERSION, base, safeText } = require('./schema');
const { publicMetadata } = require('./image-intake');

function arr(value) {
  if (Array.isArray(value)) return value.map((item) => safeText(item)).filter(Boolean).slice(0, 24);
  if (typeof value === 'string' && value.trim()) return [safeText(value)];
  return [];
}

function objects(value, limit = 24) {
  return Array.isArray(value) ? value.slice(0, limit).map((item) => (item && typeof item === 'object' ? item : { name: safeText(item) })) : [];
}

function confidence(value, fallback = 0.38) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(1, numeric));
}

function emptyStyle() {
  return {
    genreGuess: null,
    mood: [],
    colorPalette: [],
    materialPalette: [],
    shapeLanguage: [],
    silhouetteRules: [],
    trimLanguage: [],
    lightingLanguage: [],
    VFXLanguage: [],
    UILanguage: [],
    cameraLanguage: [],
    forbiddenCheapPatterns: [],
    robloxTranslationNotes: [],
  };
}

function emptyScene() {
  return {
    sceneType: null,
    likelyScale: null,
    foreground: [],
    midground: [],
    background: [],
    focalPoints: [],
    majorStructures: [],
    propGroups: [],
    walkableAreasHypothesis: [],
    blockedAreasHypothesis: [],
    verticalityHypothesis: null,
    interiorExteriorGuess: null,
    gameplayUseCases: [],
  };
}

function emptyMaterials() {
  return {
    likelyMaterials: [],
    surfaceFinish: [],
    roughness: null,
    metal: null,
    glow: null,
    robloxBuiltInFallbacks: [],
    materialVariantSuggestions: [],
    surfaceAppearanceManualRequiredSpecs: [],
    mobileFallback: [],
  };
}

function emptyGameplay() {
  return {
    possiblePlayerSpawn: null,
    likelyObjective: null,
    interactionPoints: [],
    traversalRoute: [],
    socialPossibilities: [],
    combatPossibilities: [],
    shopPossibilities: [],
    questPossibilities: [],
    portalPossibilities: [],
    rewardLoopIdeas: [],
    cinematicMoments: [],
    qaRisks: [],
  };
}

function emptyHints() {
  return {
    worldgen: [],
    assetforge: [],
    vfx: [],
    cinematic: [],
    qa: [],
    execution: [],
  };
}

function normalizeStructuredVision(data = {}) {
  const style = data.styleProfile || {};
  const scene = data.sceneUnderstanding || {};
  const materials = data.materialLanguage || {};
  const gameplay = data.gameplayInterpretation || {};
  const hints = data.productionHints || {};
  return {
    styleProfile: {
      ...emptyStyle(),
      genreGuess: safeText(style.genreGuess) || null,
      mood: arr(style.mood),
      colorPalette: arr(style.colorPalette),
      materialPalette: arr(style.materialPalette),
      shapeLanguage: arr(style.shapeLanguage),
      silhouetteRules: arr(style.silhouetteRules),
      lightingLanguage: arr(style.lightingLanguage),
      VFXLanguage: arr(style.VFXLanguage || style.vfxLanguage),
      robloxTranslationNotes: arr(style.robloxTranslationNotes),
    },
    sceneUnderstanding: {
      ...emptyScene(),
      sceneType: safeText(scene.sceneType) || null,
      likelyScale: safeText(scene.likelyScale) || null,
      foreground: arr(scene.foreground),
      midground: arr(scene.midground),
      background: arr(scene.background),
      focalPoints: arr(scene.focalPoints),
      majorStructures: arr(scene.majorStructures),
      propGroups: arr(scene.propGroups),
      walkableAreasHypothesis: arr(scene.walkableAreasHypothesis),
      blockedAreasHypothesis: arr(scene.blockedAreasHypothesis),
      verticalityHypothesis: safeText(scene.verticalityHypothesis) || null,
      interiorExteriorGuess: safeText(scene.interiorExteriorGuess) || null,
      gameplayUseCases: arr(scene.gameplayUseCases),
    },
    materialLanguage: {
      ...emptyMaterials(),
      likelyMaterials: arr(materials.likelyMaterials),
      surfaceFinish: arr(materials.surfaceFinish),
      glow: safeText(materials.glow) || null,
      robloxBuiltInFallbacks: arr(materials.robloxBuiltInFallbacks),
      materialVariantSuggestions: arr(materials.materialVariantSuggestions),
      mobileFallback: arr(materials.mobileFallback),
    },
    objectCandidates: objects(data.objectCandidates).map((item) => ({
      name: safeText(item.name || item.id || 'object'),
      role: safeText(item.role || item.category || 'referenceObject'),
      confidence: confidence(item.confidence, 0.55),
      notes: arr(item.notes || item.description),
    })),
    layoutHypotheses: objects(data.layoutHypotheses, 8).map((item) => ({
      name: safeText(item.name || 'layoutHypothesis'),
      notes: arr(item.notes || item.description),
      confidence: confidence(item.confidence, 0.5),
    })),
    gameplayInterpretation: {
      ...emptyGameplay(),
      possiblePlayerSpawn: safeText(gameplay.possiblePlayerSpawn) || null,
      likelyObjective: safeText(gameplay.likelyObjective) || null,
      interactionPoints: arr(gameplay.interactionPoints),
      traversalRoute: arr(gameplay.traversalRoute),
      shopPossibilities: arr(gameplay.shopPossibilities),
      questPossibilities: arr(gameplay.questPossibilities),
      portalPossibilities: arr(gameplay.portalPossibilities),
      rewardLoopIdeas: arr(gameplay.rewardLoopIdeas),
      cinematicMoments: arr(gameplay.cinematicMoments),
      qaRisks: arr(gameplay.qaRisks),
    },
    missingViews: objects(data.missingViews, 12).map((item) => ({
      question: safeText(item.question || item.name || 'What does this reference not show?'),
      reason: safeText(item.reason || 'Needed for faithful playable reconstruction.'),
      importance: safeText(item.importance || 'medium'),
    })),
    productionHints: {
      ...emptyHints(),
      worldgen: arr(hints.worldgen),
      assetforge: arr(hints.assetforge),
      vfx: arr(hints.vfx),
      cinematic: arr(hints.cinematic),
      qa: arr(hints.qa),
      execution: arr(hints.execution),
    },
    confidence: confidence(data.confidence, 0.72),
    warnings: arr(data.warnings),
  };
}

function buildVisionReport({ intake, vision, modeOverride } = {}) {
  const metadata = publicMetadata(intake && intake.imageMetadata ? intake.imageMetadata : {});
  const referenceId = intake && intake.referenceId;
  const mode = modeOverride || (vision && vision.status) || (intake && intake.mode) || 'metadataOnly';
  const structured = vision && vision.structured ? normalizeStructuredVision(vision.structured) : {
    styleProfile: emptyStyle(),
    sceneUnderstanding: emptyScene(),
    materialLanguage: emptyMaterials(),
    objectCandidates: [],
    layoutHypotheses: [],
    gameplayInterpretation: emptyGameplay(),
    missingViews: [],
    productionHints: emptyHints(),
    confidence: intake && intake.available ? 0.34 : 0,
    warnings: [],
  };
  const actualVisionUsed = Boolean(vision && vision.actualVisionUsed && mode === 'apiVision');
  const warnings = [
    ...(intake && intake.warnings || []),
    ...(vision && vision.warnings || []),
    ...(structured.warnings || []),
  ];
  const blockers = [
    ...(intake && intake.blockers || []),
    ...(vision && vision.blockers || []),
  ];
  return base({
    referenceId,
    goal: metadata.fileName || metadata.displayPath || 'local image reference',
    mode,
    available: Boolean(intake && intake.available),
    apiConfigured: Boolean(intake && intake.apiConfigured),
    actualVisionUsed,
    imageMetadata: metadata,
    styleProfile: structured.styleProfile,
    sceneUnderstanding: structured.sceneUnderstanding,
    materialLanguage: structured.materialLanguage,
    objectCandidates: structured.objectCandidates,
    layoutHypotheses: structured.layoutHypotheses,
    gameplayInterpretation: structured.gameplayInterpretation,
    missingViews: structured.missingViews,
    productionHints: structured.productionHints,
    confidence: actualVisionUsed ? structured.confidence : (intake && intake.available ? 0.34 : 0),
    apiVision: vision ? {
      configured: Boolean(intake && intake.apiConfigured),
      used: actualVisionUsed,
      provider: vision.provider || null,
      model: vision.model || null,
      responseId: vision.responseId || null,
      status: vision.status || mode,
      errorSummary: vision.errorSummary || null,
    } : {
      configured: Boolean(intake && intake.apiConfigured),
      used: false,
      provider: null,
      model: null,
      responseId: null,
      status: mode,
      errorSummary: null,
    },
    rawBytesStored: false,
    privacy: intake && intake.privacy,
    warnings,
    blockers,
    nextCommand: actualVisionUsed
      ? `tools\\bridge.cmd worldcompile image "${metadata.displayPath || metadata.fileName || '<imagePath>'}"`
      : (intake && intake.available
        ? `tools\\bridge.cmd reference analyze-image "${metadata.displayPath || metadata.fileName || '<imagePath>'}"`
        : 'tools\\bridge.cmd reference image "<valid-local-image-path>"'),
  });
}

module.exports = {
  buildVisionReport,
  emptyGameplay,
  emptyHints,
  emptyMaterials,
  emptyScene,
  emptyStyle,
  normalizeStructuredVision,
};
