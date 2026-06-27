'use strict';

const { VERSION, SCORE_KEYS, SCORE_WEIGHTS, clampScore, nowIso } = require('./schema');
const { rubricForKey } = require('./critique-rubric');

const BASE_SCORES = {
  firstImpression: 74,
  focalHierarchy: 72,
  silhouetteReadability: 70,
  lightingDepth: 66,
  colorHarmony: 72,
  materialCohesion: 68,
  environmentalStorytelling: 66,
  scaleAndProportion: 70,
  detailDensity: 68,
  clutterControl: 64,
  vfxIntegration: 68,
  uiIntegration: 70,
  cameraComposition: 69,
  mobileReadability: 66,
  performanceRisk: 72,
  premiumFeel: 70,
};

const FIXES = {
  firstImpression: ['Frame one clear hero landmark from spawn.', 'Add a strong arrival read before adding decoration.'],
  focalHierarchy: ['Increase contrast around the main objective.', 'Reduce competing neon/signage near secondary zones.'],
  silhouetteReadability: ['Use larger forms, trim bands, and readable gaps.', 'Avoid tiny detail before the big shape reads.'],
  lightingDepth: ['Add warm/cool separation and a rim/accent light on the focal object.', 'Darken background noise slightly.'],
  colorHarmony: ['Lock to a small palette with one accent family.', 'Remove random high-saturation colors.'],
  materialCohesion: ['Replace default materials with a consistent material stack.', 'Use trims/decals to break flat surfaces.'],
  environmentalStorytelling: ['Add props/signage that explain the loop and destination.', 'Make the reward promise visible from spawn.'],
  scaleAndProportion: ['Use player-scale reference measurements.', 'Widen main paths and make thresholds obvious.'],
  detailDensity: ['Concentrate detail around focal landmarks and interaction pads.', 'Leave calmer negative space along travel paths.'],
  clutterControl: ['Delete or merge low-value visual noise.', 'Group props by purpose instead of scattering them.'],
  vfxIntegration: ['Attach VFX to focal beats and marker timing.', 'Cap emitter rates and keep transparent layers readable.'],
  uiIntegration: ['Move HUD off the central focal read.', 'Verify label scale and safe-area on phone.'],
  cameraComposition: ['Use foreground framing and a clear vanishing route.', 'Add camera bookmarks for spawn and hero shots.'],
  mobileReadability: ['Simplify distant labels and large contrast zones.', 'Audit phone portrait and landscape screenshots.'],
  performanceRisk: ['Reduce overdraw, active lights, and tiny decorative parts.', 'Create mobile fallback tiers.'],
  premiumFeel: ['Run a polish loop from critique evidence instead of adding random detail.', 'Verify with before/after screenshots.'],
};

function evidenceFor(key, pack) {
  const rubric = rubricForKey(key);
  const shot = pack && Array.isArray(pack.shots) ? pack.shots.find((item) => item.id === rubric.shotId) : null;
  return [
    shot ? `${shot.id}: ${shot.purpose}` : `${rubric.shotId}: planned evidence`,
    rubric.question,
    pack && pack.availableEvidence && pack.availableEvidence.actualPixels ? 'verified pixel capture' : 'structured evidence fallback',
  ];
}

function scoreKey(key, pack, options = {}) {
  let score = BASE_SCORES[key] || 68;
  if (pack && pack.availableEvidence && pack.availableEvidence.actualPixels) score += 6;
  if (pack && pack.availableEvidence && pack.availableEvidence.cameraReport) score += 2;
  if (pack && pack.availableEvidence && pack.availableEvidence.liveVision) score += 1;
  if (options.boost && Number.isFinite(options.boost[key])) score += options.boost[key];
  score = clampScore(score);
  const level = score >= 86 ? 'strong' : score >= 74 ? 'promising' : score >= 62 ? 'needs polish' : 'weak';
  return {
    score,
    weight: SCORE_WEIGHTS[key] || 1,
    reason: `${level}: ${rubricForKey(key).question}`,
    evidence: evidenceFor(key, pack),
    fixes: FIXES[key] || ['Collect visual evidence and run a targeted polish pass.'],
  };
}

function createVisualQualityScore(goal, evidencePack, options = {}) {
  const subScores = {};
  let weighted = 0;
  let weightTotal = 0;
  for (const key of SCORE_KEYS) {
    const item = scoreKey(key, evidencePack, options);
    subScores[key] = item;
    weighted += item.score * item.weight;
    weightTotal += item.weight;
  }
  const overallScore = clampScore(weighted / Math.max(1, weightTotal));
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal,
    overallScore,
    score: overallScore,
    subScores,
    warnings: evidencePack && Array.isArray(evidencePack.warnings) ? [...evidencePack.warnings] : [],
    blockers: evidencePack && Array.isArray(evidencePack.blockers) ? [...evidencePack.blockers] : [],
    nextCommand: `tools\\bridge.cmd visual polish "${goal}"`,
  };
}

module.exports = { createVisualQualityScore, SCORE_KEYS };
