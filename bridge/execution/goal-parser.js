'use strict';

const { SYSTEMS, safeGoal, slugify } = require('./schema');

function parseGoal(goal, options = {}) {
  const clean = safeGoal(goal || options.goal || options.intent || options.text);
  const q = clean.toLowerCase();
  let system = options.system || SYSTEMS.generic;
  if (!options.system) {
    if (/world|map|dungeon|hub|layout|zone|path|lobby|arena/.test(q)) system = SYSTEMS.worldgen;
    if (/asset|prop|kit|mesh|material|trim|bevel|swatch/.test(q)) system = SYSTEMS.assetkit;
    if (/cinematic|camera|beat|intro|gamefeel|game feel|hitstop|screen shake|motion/.test(q)) system = SYSTEMS.cinematic;
    if (/qa|test|route|marker|probe|launch/.test(q)) system = SYSTEMS.qaMarkers;
    if (/polish|improve|premium pass|fix/.test(q)) system = SYSTEMS.polish;
    if (/safe fix|apply safe|fix issue/.test(q)) system = SYSTEMS.safeFix;
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
