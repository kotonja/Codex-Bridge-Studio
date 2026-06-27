'use strict';

const { AUDIT_KEYS, BEAT_CONCEPTS, POLISH_STAGES, REQUIRED_MARKERS, ROOTS, VERSION, nowIso, safeGoal } = require('./schema');
const { getStyle, getStyleCatalog } = require('./style-catalog');
const { parseGoal } = require('./goal-parser');
const { createBeatSheet } = require('./beat-sheet');
const { createTimeline } = require('./timeline-planner');
const { createAnimationPlan } = require('./animation-planner');
const { createVfxSyncPlan } = require('./vfx-sync-planner');
const { createAudioSyncPlan } = require('./audio-sync-planner');
const { createCameraPlan } = require('./camera-planner');
const { createGameFeelPlan } = require('./gamefeel-planner');
const { createPreviewPlan } = require('./preview-plan');
const { createBuildPlan } = require('./build-plan');
const { createAuditReport } = require('./audit-report');
const { createPolishPlan } = require('./polish-plan');
const { createManifest, manifestPath } = require('./manifest-store');

function parsed(goal) {
  return parseGoal(safeGoal(goal));
}

function fullContext(goal) {
  const p = parsed(goal);
  const style = getStyle(p.styleId);
  const beatSheet = createBeatSheet(p, style);
  const timeline = createTimeline(p, beatSheet);
  return { p, style, beatSheet, timeline };
}

function createStatus() {
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    status: 'ready',
    roots: ROOTS,
    capabilities: [
      'beatSheetPlanning',
      'timelinePlanning',
      'animationMarkerPlanning',
      'vfxSyncPlanning',
      'audioCuePlanning',
      'cameraBeatPlanning',
      'screenShakePlanning',
      'hitStopPlanning',
      'uiPunchPlanning',
      'gameFeelScoring',
      'mobileMotionBudget',
      'previewManifests',
      'premiumIntegration',
      'assetforgeIntegration',
      'worldgenIntegration',
      'visualCriticIntegration',
    ],
    integrations: {
      premiumDirector: true,
      visualCritic: true,
      worldgen: true,
      assetforge: true,
      animation: true,
      vfx: true,
      audio: true,
      cameraScreen: true,
      testPilot: true,
    },
    warnings: [],
    blockers: [],
    nextCommand: 'tools\\bridge.cmd cinematic plan "anime boss intro attack"',
  };
}

function createIntentPlan(goal) {
  const p = parsed(goal);
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: p.goal,
    styleId: p.styleId,
    momentType: p.momentType,
    durationSeconds: p.durationSeconds,
    qualityTarget: p.qualityTarget,
    beatCount: BEAT_CONCEPTS.length,
    primaryReadabilityGoal: p.primaryReadabilityGoal,
    specialistRoutes: { animation: true, vfx: true, audio: true, camera: true, ui: true, test: true },
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd cinematic timeline "${p.goal}"`,
  };
}

function createBeatSheetReport(goal) {
  const { p, style, beatSheet } = fullContext(goal);
  return { ok: true, version: VERSION, at: nowIso(), ...beatSheet, styleId: p.styleId, styleTitle: style.title, nextCommand: `tools\\bridge.cmd cinematic timeline "${p.goal}"` };
}

function createTimelinePlan(goal) {
  return fullContext(goal).timeline;
}

function createAnimationReport(goal) {
  const { p, timeline } = fullContext(goal);
  return createAnimationPlan(p, timeline);
}

function createVfxSyncReport(goal) {
  const { p, timeline } = fullContext(goal);
  return createVfxSyncPlan(p, timeline);
}

function createAudioSyncReport(goal) {
  const { p, timeline } = fullContext(goal);
  return createAudioSyncPlan(p, timeline);
}

function createCameraReport(goal) {
  const { p, timeline } = fullContext(goal);
  return createCameraPlan(p, timeline);
}

function createGameFeelReport(goal) {
  const { p, timeline } = fullContext(goal);
  return createGameFeelPlan(p, timeline);
}

function createPreviewReport(goal) {
  const p = parsed(goal);
  return createPreviewPlan(p, manifestPath(p.goal));
}

function createAudit(goal) {
  const { p, timeline } = fullContext(goal);
  return createAuditReport(p, timeline);
}

function createPolish(goal) {
  const { p, timeline } = fullContext(goal);
  return createPolishPlan(p, createAuditReport(p, timeline));
}

function createManifestReport(goal, options = {}) {
  const { p, timeline } = fullContext(goal);
  const animationPlan = createAnimationPlan(p, timeline);
  const vfxSyncPlan = createVfxSyncPlan(p, timeline);
  const audioSyncPlan = createAudioSyncPlan(p, timeline);
  const cameraPlan = createCameraPlan(p, timeline);
  const gameFeelPlan = createGameFeelPlan(p, timeline);
  const audit = createAuditReport(p, timeline);
  return createManifest(p, { timeline, animationPlan, vfxSyncPlan, audioSyncPlan, cameraPlan, gameFeelPlan, audit, warnings: options.warnings || [], blockers: options.blockers || [] });
}

function createGenerationReport(goal, options = {}) {
  const manifest = createManifestReport(goal, options);
  const p = parsed(goal);
  const buildPlan = createBuildPlan(p, manifest.manifestPath);
  if (options.studioConnected === false) {
    return {
      ...manifest,
      ok: false,
      status: 'manualRequired',
      manualRequired: true,
      warnings: [...manifest.warnings, 'Studio is not connected; returning a cinematic package manifest without claiming Studio objects were created.'],
      nextCommand: 'tools\\bridge.cmd connect',
    };
  }
  return {
    ...manifest,
    status: 'codexOwnedGenerationPlan',
    createdPaths: buildPlan.createdPaths,
    attributes: buildPlan.attributes,
    warnings: manifest.warnings,
    blockers: manifest.blockers,
    nextCommand: `tools\\bridge.cmd cinematic preview "${manifest.goal}"`,
  };
}

module.exports = {
  AUDIT_KEYS,
  BEAT_CONCEPTS,
  POLISH_STAGES,
  REQUIRED_MARKERS,
  ROOTS,
  VERSION,
  createAnimationPlan: createAnimationReport,
  createAudioSyncPlan: createAudioSyncReport,
  createAuditReport: createAudit,
  createBeatSheet: createBeatSheetReport,
  createCameraPlan: createCameraReport,
  createGameFeelPlan: createGameFeelReport,
  createGenerationReport,
  createIntentPlan,
  createManifest: createManifestReport,
  createPolishPlan: createPolish,
  createPreviewPlan: createPreviewReport,
  createStatus,
  createTimelinePlan,
  createVfxSyncPlan: createVfxSyncReport,
  getStyle,
  getStyleCatalog,
  manifestPath,
  parseGoal,
};
