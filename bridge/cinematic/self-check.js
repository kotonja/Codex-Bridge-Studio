'use strict';

const fs = require('fs');
const path = require('path');
const Cinematic = require('./index');
const { createRoute } = require('../command-router');

const MODULES = [
  'index.js',
  'schema.js',
  'style-catalog.js',
  'goal-parser.js',
  'timing-language.js',
  'beat-sheet.js',
  'timeline-planner.js',
  'animation-planner.js',
  'marker-planner.js',
  'vfx-sync-planner.js',
  'audio-sync-planner.js',
  'camera-planner.js',
  'screen-shake-planner.js',
  'hitstop-planner.js',
  'ui-punch-planner.js',
  'gamefeel-planner.js',
  'ability-window-planner.js',
  'mobile-motion-budget.js',
  'preview-plan.js',
  'build-plan.js',
  'audit-report.js',
  'polish-plan.js',
  'manifest-store.js',
  'self-check.js',
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const base = __dirname;
  const missing = MODULES.filter((file) => !fs.existsSync(path.join(base, file)));
  assert(missing.length === 0, `Missing cinematic modules: ${missing.join(', ')}`);

  const goal = 'anime boss intro attack';
  const status = Cinematic.createStatus();
  const styles = Cinematic.getStyleCatalog();
  const plan = Cinematic.createIntentPlan(goal);
  const timeline = Cinematic.createTimelinePlan(goal);
  const beats = Cinematic.createBeatSheet(goal);
  const animation = Cinematic.createAnimationPlan(goal);
  const vfx = Cinematic.createVfxSyncPlan(goal);
  const audio = Cinematic.createAudioSyncPlan(goal);
  const camera = Cinematic.createCameraPlan(goal);
  const gamefeel = Cinematic.createGameFeelPlan(goal);
  const manifest = Cinematic.createGenerationReport(goal, { studioConnected: true });
  const audit = Cinematic.createAuditReport(goal);
  const polish = Cinematic.createPolishPlan(goal);

  assert(status.ok && status.version === '0.72.0', 'status version/shape failed');
  assert(styles.length >= 16, 'style catalog must include at least 16 styles');
  for (const style of styles) {
    for (const key of ['motionPillars', 'timingPillars', 'cameraLanguage', 'animationLanguage', 'vfxLanguage', 'audioLanguage', 'uiPunchLanguage', 'shakeRules', 'hitStopRules', 'mobileMotionHints', 'forbiddenCheapPatterns']) {
      assert(Array.isArray(style[key]), `style ${style.id} missing ${key}`);
    }
  }
  for (const key of ['version', 'goal', 'styleId', 'momentType', 'durationSeconds', 'qualityTarget', 'beatCount', 'primaryReadabilityGoal', 'specialistRoutes', 'warnings', 'blockers', 'nextCommand']) assert(plan[key] !== undefined, `plan missing ${key}`);
  for (const key of ['beats', 'animationMarkers', 'vfxEvents', 'audioEvents', 'cameraEvents', 'uiEvents', 'gameplayWindows']) assert(Array.isArray(timeline[key]) && timeline[key].length > 0, `timeline missing ${key}`);
  for (const concept of ['setup', 'anticipation', 'windup', 'contact', 'impact', 'hold', 'release', 'followThrough', 'recovery', 'rewardReadability']) assert(beats.beats.some((beat) => beat.id === concept) || beats.omittedBeats.some((beat) => beat.id === concept), `beat concept missing: ${concept}`);
  for (const marker of ['Start', 'Anticipation', 'Windup', 'Contact', 'Impact', 'Release', 'FollowThrough', 'Recovery', 'End']) assert(animation.markerNames.includes(marker), `animation marker missing ${marker}`);
  for (const role of ['charge', 'trail', 'flash', 'burst', 'debris', 'smoke', 'lingering aura', 'cleanup']) assert(vfx.cues.some((cue) => cue.role === role), `vfx role missing ${role}`);
  assert(audio.cues.every((cue) => cue.soundSpec.assetId === null && cue.manualRequired === true), 'audio sync must not fake asset ids and must be manualRequired without supplied sounds');
  assert(camera.cameraEvents.some((event) => event.type === 'shake') && camera.releaseBehavior && camera.mobileMotionReduction, 'camera plan missing shake/release/mobile fallback');
  for (const key of ['anticipationClarity', 'inputBufferSuggestion', 'hitStop', 'uiPunch', 'recoveryTiming']) assert(gamefeel[key] !== undefined, `gamefeel missing ${key}`);
  for (const key of ['version', 'goal', 'momentType', 'warnings', 'blockers', 'nextCommand']) assert(manifest[key] !== undefined, `generation manifest missing ${key}`);
  assert(Object.keys(audit.subScores).length === Cinematic.AUDIT_KEYS.length, 'audit subscore count mismatch');
  assert(polish.stages.length === Cinematic.POLISH_STAGES.length, 'polish stage count mismatch');

  const routes = {
    cinematic: createRoute('make combat feel good').category,
    premium: createRoute('make premium anime dungeon hub').category,
    assetforge: createRoute('make premium props for anime dungeon').category,
    worldgen: createRoute('make a dungeon map').category,
    visual: createRoute('visual critique').category,
    vfx: createRoute('generate purple sword slash vfx').category,
    pairing: createRoute('new pairing code').category,
  };
  assert(routes.cinematic === 'cinematic', 'combat feel route must be cinematic');
  assert(routes.premium === 'premiumDirector', 'premium route must stay premiumDirector');
  assert(routes.assetforge === 'assetforge', 'asset route must stay assetforge');
  assert(routes.worldgen === 'worldgen', 'worldgen route must stay worldgen');
  assert(routes.visual === 'visual', 'visual route must stay visual');
  assert(routes.vfx === 'vfx', 'vfx route must stay vfx');
  assert(routes.pairing === 'pairing', 'pairing route must stay pairing');

  return {
    ok: true,
    version: Cinematic.VERSION,
    moduleCount: MODULES.length,
    styleCount: styles.length,
    beatCount: beats.beats.length,
    markerCount: animation.markerNames.length,
    vfxCueCount: vfx.cues.length,
    audioCueCount: audio.cues.length,
    cameraEventCount: camera.cameraEvents.length,
    auditScoreKeys: Object.keys(audit.subScores).length,
    polishStages: polish.stages.length,
    routes,
    audioManualRequired: audio.cues.every((cue) => cue.manualRequired),
    generationStatus: manifest.status,
  };
}

module.exports = { run };
