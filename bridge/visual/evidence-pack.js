'use strict';

const { VERSION, safeGoal, nowIso } = require('./schema');
const { createShotPlan } = require('./camera-shot-plan');

function truthyEvidence(value) {
  if (value === true || value === false) return value;
  if (value && typeof value === 'object' && value.ok === false) return false;
  return Boolean(value);
}

function createEvidencePack(goal, options = {}) {
  const cleanGoal = safeGoal(goal || options.goal || options.intent);
  const connected = options.studioConnected !== false && options.connected !== false;
  const actualPixels = options.actualPixels === true && options.pixelEvidenceVerified === true;
  const availableEvidence = {
    liveVision: connected && truthyEvidence(options.liveVision ?? options.watch ?? true),
    screenControl: connected && truthyEvidence(options.screenControl ?? true),
    cameraReport: connected && truthyEvidence(options.cameraReport ?? true),
    playtestSnapshot: connected && truthyEvidence(options.playtestSnapshot ?? options.testSnapshot ?? true),
    actualPixels,
  };
  const warnings = [];
  const blockers = [];
  if (!connected) {
    warnings.push('Studio is not connected; visual evidence is a structured plan only.');
  }
  if (!actualPixels) {
    warnings.push('Actual screenshot pixel analysis unavailable; using structured Studio evidence.');
  }
  const shots = createShotPlan(cleanGoal, {
    available: connected,
    actualPixels,
    evidenceType: actualPixels ? 'pixelCapture' : 'cameraReport',
  });
  return {
    ok: true,
    version: VERSION,
    goal: cleanGoal,
    at: nowIso(),
    availableEvidence,
    shots,
    sceneFacts: {
      source: connected ? 'structured Studio reports and route context' : 'planned fallback',
      likelyNeeds: ['clear spawn reveal', 'strong focal landmark', 'readable route', 'bounded detail density'],
      evidenceConfidence: connected ? 'structured' : 'planned',
    },
    uiFacts: {
      source: connected ? 'screen/live-vision reports when available' : 'not connected',
      needsProof: ['HUD does not hide focal point', 'labels fit on mobile', 'important buttons remain readable'],
    },
    lightingFacts: {
      source: connected ? 'camera/screen reports and style rules' : 'not connected',
      needsProof: ['foreground/midground/background separation', 'hero rim/accent light', 'no flat default lighting'],
    },
    performanceFacts: {
      source: 'bridge budgets and structured counts when connected',
      risksToWatch: ['transparent overdraw', 'too many small neon accents', 'dense particles at spawn', 'mobile readability loss'],
    },
    warnings,
    blockers,
    nextCommand: `tools\\bridge.cmd visual critique "${cleanGoal}"`,
  };
}

module.exports = { createEvidencePack };
