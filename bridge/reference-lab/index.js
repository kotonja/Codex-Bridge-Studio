'use strict';

const { VERSION, base, stableReferenceId, safeText } = require('./schema');
const { getStatus } = require('./status');
const { getIntakeReport } = require('./intake');
const { classifySource } = require('./media-policy');
const { analyzeNote } = require('./note-analyzer');
const { maybeAnalyzeImage } = require('./api-image-analyzer');
const { extractStyleProfile } = require('./style-extractor');
const { understandScene } = require('./scene-understanding');
const { extractMaterialLanguage } = require('./material-language');
const { extractObjectCandidates } = require('./object-candidates');
const { createFocalHierarchy } = require('./focal-hierarchy');
const { createLayoutHypotheses } = require('./layout-hypotheses');
const { interpretGameplay } = require('./gameplay-interpretation');
const { createMissingViewReport } = require('./missing-view-report');
const { createProductionHints } = require('./production-hints');
const { createCompareReport } = require('./compare-report');
const { saveManifest } = require('./manifest-store');
const { rememberReferenceProfile } = require('./memory-integration');

function contextFrom(input = '') {
  return analyzeNote(input || 'Roblox reference');
}

async function analyzeReference(input = '', options = {}) {
  const intake = getIntakeReport(input, { store: options.storeIntake !== false });
  if (!intake.available) {
    return base({
      referenceId: intake.referenceId,
      goal: safeText(input),
      mode: 'unavailable',
      actualVisionUsed: false,
      confidence: 0,
      styleProfile: emptyStyle(),
      sceneUnderstanding: emptyScene(),
      materialLanguage: emptyMaterials(),
      objectCandidates: [],
      focalHierarchy: [],
      layoutHypotheses: [],
      gameplayInterpretation: emptyGameplay(),
      missingViews: [],
      productionHints: createProductionHints(contextFrom(input)),
      warnings: intake.warnings,
      blockers: intake.blockers,
      nextCommand: intake.nextCommand,
    });
  }

  const classification = classifySource(input);
  const vision = await maybeAnalyzeImage(classification);
  const ctx = contextFrom(input);
  const mode = vision.used ? 'apiVision' : (classification.sourceKind === 'image' || classification.mode === 'localFile' || classification.mode === 'folder' ? 'metadataOnly' : 'noteOnly');
  const styleProfile = extractStyleProfile(ctx);
  const sceneUnderstanding = understandScene(ctx);
  const materialLanguage = extractMaterialLanguage(ctx);
  const objectCandidates = extractObjectCandidates(ctx);
  const focalHierarchy = createFocalHierarchy(ctx);
  const layoutHypotheses = createLayoutHypotheses(ctx);
  const gameplayInterpretation = interpretGameplay(ctx);
  const missingViews = createMissingViewReport(ctx);
  const productionHints = createProductionHints(ctx);
  const report = base({
    referenceId: intake.referenceId || stableReferenceId(input),
    goal: ctx.clean,
    input: safeText(input),
    mode,
    sourceKind: classification.sourceKind,
    actualVisionUsed: Boolean(vision.used),
    confidence: vision.used ? 0.82 : (mode === 'noteOnly' ? 0.58 : 0.38),
    styleProfile,
    sceneUnderstanding,
    materialLanguage,
    objectCandidates,
    focalHierarchy,
    layoutHypotheses,
    gameplayInterpretation,
    missingViews,
    productionHints,
    intake,
    apiVision: {
      configured: intake.apiConfigured,
      used: Boolean(vision.used),
      preparedRequest: vision.preparedRequest || null,
    },
    warnings: [...(intake.warnings || []), ...(vision.warnings || [])],
    blockers: [...(intake.blockers || []), ...(vision.blockers || [])],
    nextCommand: `tools\\bridge.cmd reference style "${ctx.clean.replace(/"/g, '\\"')}"`,
  });
  return report;
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

async function pick(input, picker) {
  const report = await analyzeReference(input);
  return picker(report);
}

async function getStyleProfile(input) {
  return pick(input, (report) => base({ referenceId: report.referenceId, goal: report.goal, styleProfile: report.styleProfile, actualVisionUsed: report.actualVisionUsed, warnings: report.warnings, blockers: report.blockers, nextCommand: `tools\\bridge.cmd premium style "${report.goal}"` }));
}

async function getSceneUnderstanding(input) {
  return pick(input, (report) => base({ referenceId: report.referenceId, goal: report.goal, sceneUnderstanding: report.sceneUnderstanding, actualVisionUsed: report.actualVisionUsed, warnings: report.warnings, blockers: report.blockers, nextCommand: `tools\\bridge.cmd worldgen graph "${report.goal}"` }));
}

async function getMaterialLanguage(input) {
  return pick(input, (report) => base({ referenceId: report.referenceId, goal: report.goal, materialLanguage: report.materialLanguage, actualVisionUsed: report.actualVisionUsed, warnings: report.warnings, blockers: report.blockers, nextCommand: `tools\\bridge.cmd assetforge material-plan "${report.goal}"` }));
}

async function getObjectCandidates(input) {
  return pick(input, (report) => base({ referenceId: report.referenceId, goal: report.goal, objectCandidates: report.objectCandidates, actualVisionUsed: report.actualVisionUsed, warnings: report.warnings, blockers: report.blockers, nextCommand: `tools\\bridge.cmd assetforge kit "${report.goal}"` }));
}

async function getLayoutHypotheses(input) {
  return pick(input, (report) => base({ referenceId: report.referenceId, goal: report.goal, layoutHypotheses: report.layoutHypotheses, actualVisionUsed: report.actualVisionUsed, warnings: report.warnings, blockers: report.blockers, nextCommand: `tools\\bridge.cmd worldgen graph "${report.goal}"` }));
}

async function getGameplayInterpretation(input) {
  return pick(input, (report) => base({ referenceId: report.referenceId, goal: report.goal, gameplayInterpretation: report.gameplayInterpretation, actualVisionUsed: report.actualVisionUsed, warnings: report.warnings, blockers: report.blockers, nextCommand: `tools\\bridge.cmd qa plan "${report.goal}"` }));
}

async function getMissingViewReport(input) {
  return pick(input, (report) => base({ referenceId: report.referenceId, goal: report.goal, missingViews: report.missingViews, actualVisionUsed: report.actualVisionUsed, warnings: report.warnings, blockers: report.blockers, nextCommand: `tools\\bridge.cmd reference layout "${report.goal}"` }));
}

async function compareReferences(refA, refB) {
  const [analysisA, analysisB] = await Promise.all([analyzeReference(refA), analyzeReference(refB)]);
  return createCompareReport(refA, refB, analysisA, analysisB);
}

async function getManifest(input) {
  const analysis = await analyzeReference(input);
  const manifest = {
    version: VERSION,
    referenceId: analysis.referenceId,
    goal: analysis.goal,
    mode: analysis.mode,
    actualVisionUsed: analysis.actualVisionUsed,
    styleProfile: analysis.styleProfile,
    sceneUnderstanding: analysis.sceneUnderstanding,
    materialLanguage: analysis.materialLanguage,
    objectCandidates: analysis.objectCandidates,
    focalHierarchy: analysis.focalHierarchy,
    layoutHypotheses: analysis.layoutHypotheses,
    gameplayInterpretation: analysis.gameplayInterpretation,
    missingViews: analysis.missingViews,
    productionHints: analysis.productionHints,
    privacy: analysis.intake && analysis.intake.privacy,
  };
  const stored = saveManifest(manifest);
  return base({ referenceId: analysis.referenceId, goal: analysis.goal, manifest, store: { relativeFile: stored.relativeFile }, nextCommand: `tools\\bridge.cmd reference remember "${analysis.goal}"` });
}

async function remember(input, options = {}) {
  const analysis = await analyzeReference(input);
  return rememberReferenceProfile(analysis, options);
}

module.exports = {
  VERSION,
  analyzeReference,
  compareReferences,
  getGameplayInterpretation,
  getIntakeReport,
  getLayoutHypotheses,
  getManifest,
  getMaterialLanguage,
  getMissingViewReport,
  getObjectCandidates,
  getSceneUnderstanding,
  getStatus,
  getStyleProfile,
  remember,
};
