'use strict';

const { SYSTEMS, safeGoal, slugify } = require('./schema');

function parseGoal(goal, options = {}) {
  const clean = safeGoal(goal || options.goal || options.intent || options.text);
  const q = clean.toLowerCase();
  let system = options.system || SYSTEMS.generic;
  if (!options.system) {
    const wantsGeometryTest = /geometry test|geometry realization|realization test|v92 geometry/.test(q);
    const wantsDetail = /less placeholder|built not placeholder|high detail|more detail|detailed|geometry detail|premium geometry|trim|trims|bevel|bevels|material swatch|material swatches|prop cluster|prop clusters|lighting fixture|lighting fixtures|detail pass/.test(q);
    const wantsArchitecture = /advanced shape grammar|shape grammar|modular architecture|architecture pass|architectural detail|architectural depth|architecture detail|portal architecture|better portal shape|better arch|better arches|improve silhouette|silhouette grammar|wall module|wall modules|roof grammar|window grammar|door grammar|pillar grammar|stair grammar|interior module|depth layering|less blocky architecture|blocky architecture|building shape premium|dungeon architecture/.test(q);
    const wantsWorld = /world|map|dungeon|hub|layout|zone|path|lobby|arena|playable|reference|gate|portal/.test(q);
    const wantsAsset = /asset|prop|kit|mesh|material|trim|bevel|swatch/.test(q);
    const wantsCinematic = /cinematic|camera|beat|intro|gamefeel|game feel|hitstop|screen shake|motion/.test(q);
    const wantsQa = /qa|test|route|marker|probe|launch/.test(q);
    const wantsPolish = /polish|improve|premium pass|fix/.test(q);
    const wantsSafeFix = /safe fix|apply safe|fix issue/.test(q);

    if (wantsGeometryTest) system = SYSTEMS.geometryTest;
    else if (wantsArchitecture) system = SYSTEMS.architecture;
    else if (wantsDetail) system = SYSTEMS.detail;
    else if (wantsWorld) system = SYSTEMS.worldgen;
    else if (wantsAsset) system = SYSTEMS.assetkit;
    else if (wantsCinematic) system = SYSTEMS.cinematic;
    else if (wantsQa) system = SYSTEMS.qaMarkers;
    else if (wantsPolish) system = SYSTEMS.polish;
    if (wantsSafeFix) system = SYSTEMS.safeFix;
    if (/premium/.test(q)) system = system === SYSTEMS.generic ? SYSTEMS.premium : system;
  }
  return {
    goal: clean,
    slug: slugify(clean, 'execution'),
    system,
    style: /anime/.test(q) ? 'anime' : (/slime|bubble/.test(q) ? 'playful' : 'premium'),
    scale: /tiny|small|throwaway/.test(q) ? 'tiny' : (/huge|massive|large/.test(q) ? 'large' : 'medium'),
    requestedRealBuild: /real|apply|studio|execute|build/.test(q),
    source: options.source || 'execution.goal-parser',
  };
}

module.exports = {
  parseGoal,
};
