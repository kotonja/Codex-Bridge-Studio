'use strict';

const { SYSTEMS, safeGoal, slugify } = require('./schema');

function parseGoal(goal, options = {}) {
  const clean = safeGoal(goal || options.goal || options.intent || options.text);
  const q = clean.toLowerCase();
  let system = options.system || SYSTEMS.generic;
  if (!options.system) {
    const wantsWorld = /world|map|dungeon|hub|layout|zone|path|lobby|arena|playable|reference|gate|portal/.test(q);
    const wantsAsset = /asset|prop|kit|mesh|material|trim|bevel|swatch/.test(q);
    const wantsCinematic = /cinematic|camera|beat|intro|gamefeel|game feel|hitstop|screen shake|motion/.test(q);
    const wantsQa = /qa|test|route|marker|probe|launch/.test(q);
    const wantsPolish = /polish|improve|premium pass|fix/.test(q);
    const wantsSafeFix = /safe fix|apply safe|fix issue/.test(q);

    if (wantsWorld) system = SYSTEMS.worldgen;
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
