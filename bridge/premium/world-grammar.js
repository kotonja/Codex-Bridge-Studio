'use strict';

const { VERSION, nowIso } = require('./schema');

function createWorldGrammarPlan(brief, styleBible) {
  const isHub = /hub|lobby|portal|spawn/i.test(brief.goal);
  return {
    version: VERSION,
    at: nowIso(),
    goal: brief.goal,
    landmarks: isHub
      ? ['spawn pad', 'hero core / boss statue', 'shop portal', 'upgrade or quest portal', 'leaderboard/social bay']
      : ['spawn readable anchor', 'main objective landmark', 'reward/replay landmark'],
    paths: ['main golden/readable path from spawn to focal', 'secondary loops to shops/quests', 'clear return route'],
    vistas: ['spawn hero reveal', 'side angle showing depth', 'close view for interaction labels'],
    spawnReadability: 'player should understand the hero objective and at least two next choices within three seconds',
    objectivePlacement: 'objective/focal sits on centerline with VFX/audio/camera socket nearby',
    portalShopQuestDistances: { primaryStuds: 28, secondaryStuds: 40, maxFirstChoiceStuds: 55 },
    verticality: 'use elevated side islands or pylons for silhouette without blocking the main path',
    occlusionBlockers: ['tall signs in front of objective', 'dense particles at spawn eye level', 'large models covering portal labels'],
    biomeZones: ['spawn welcome zone', 'hero focal zone', 'commerce/upgrade zone', 'social/status zone'],
    encounterZones: ['safe spawn', 'learn/interact', 'reward loop', 'optional challenge gate'],
    cameraBeats: ['wide spawn reveal', 'hero focal push-in', 'portal/shop sweep', 'QA mobile readability angle'],
    densityBudgetPerZone: { spawn: 'medium-low', focal: 'high but controlled', sidePortals: 'medium', background: 'low silhouettes' },
    mobileFallbackPlan: ['reduce transparent layers first', 'turn off ambient motes before hero VFX', 'keep labels above 12px equivalent', 'avoid thin rails as critical path markers'],
    warnings: [],
    blockers: [],
    evidence: ['goal archetype', 'style camera rules', 'mobile budget notes'],
    nextCommand: `tools\\bridge.cmd premium build "${brief.goal}"`,
  };
}

module.exports = { createWorldGrammarPlan };
