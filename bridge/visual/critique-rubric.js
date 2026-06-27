'use strict';

const { SCORE_KEYS } = require('./schema');

const RUBRIC = {
  firstImpression: ['spawn_default', 'Does the first camera view instantly tell the player what is premium, fun, and important?'],
  focalHierarchy: ['primary_focal_point', 'Is there one dominant hero read before secondary decoration?'],
  silhouetteReadability: ['primary_focal_point', 'Do large forms read clearly before micro detail?'],
  lightingDepth: ['lighting_depth', 'Does lighting separate foreground, midground, background, and reward areas?'],
  colorHarmony: ['spawn_default', 'Is the palette controlled with accents instead of random saturation?'],
  materialCohesion: ['clutter_check', 'Do materials feel intentional instead of default/kitbashed?'],
  environmentalStorytelling: ['gameplay_route', 'Does the scene explain the fantasy and objective through props and layout?'],
  scaleAndProportion: ['top_down_layout', 'Are player scale, doors, paths, and landmarks proportioned cleanly?'],
  detailDensity: ['clutter_check', 'Is detail concentrated around focal zones instead of sprayed everywhere?'],
  clutterControl: ['clutter_check', 'Can a player find objectives without visual noise fighting them?'],
  vfxIntegration: ['portal_or_objective_area', 'Do VFX enhance the focal beat without hiding gameplay?'],
  uiIntegration: ['ui_overlay', 'Does UI support the scene without covering important reads?'],
  cameraComposition: ['primary_focal_point', 'Is the main shot composed with depth, framing, and readable negative space?'],
  mobileReadability: ['mobile_readability', 'Does it remain readable on a phone-sized viewport?'],
  performanceRisk: ['clutter_check', 'Are particles, transparency, lights, and small parts budgeted?'],
  premiumFeel: ['spawn_default', 'Does the combined composition feel deliberate, polished, and screenshot-ready?'],
};

function rubricForKey(key) {
  const [shotId, question] = RUBRIC[key] || ['spawn_default', 'Is the scene visually strong and readable?'];
  return { key, shotId, question };
}

function allRubrics() {
  return SCORE_KEYS.map(rubricForKey);
}

module.exports = { RUBRIC, allRubrics, rubricForKey };
