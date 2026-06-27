'use strict';

const { VERSION, nowIso, safeGoal } = require('./schema');

function inferStyle(goal) {
  const q = safeGoal(goal).toLowerCase();
  if (q.includes('dungeon')) return 'dungeonCrawlerHub';
  if (q.includes('boss')) return 'bossArena';
  if (q.includes('obby')) return 'obbyWorld';
  if (q.includes('horror')) return 'horrorFacility';
  if (q.includes('sci') || q.includes('hangar')) return 'sciFiHangar';
  if (q.includes('fantasy') || q.includes('village')) return 'fantasyVillage';
  if (q.includes('element')) return 'elementalArena';
  if (q.includes('tycoon')) return 'tycoonIsland';
  if (q.includes('social')) return 'socialHangout';
  if (q.includes('training')) return 'trainingGrounds';
  if (q.includes('extraction')) return 'extractionZone';
  if (q.includes('portal')) return 'portalNexus';
  if (q.includes('underwater')) return 'underwaterCavern';
  if (q.includes('sky')) return 'skyIsland';
  if (q.includes('simulator')) return 'simulatorPlaza';
  return 'premiumAnimeHub';
}

function inferScale(goal) {
  const q = safeGoal(goal).toLowerCase();
  if (q.includes('massive') || q.includes('open world')) return 'massive';
  if (q.includes('large') || q.includes('city') || q.includes('world')) return 'large';
  if (q.includes('small') || q.includes('tiny')) return 'small';
  return 'medium';
}

function parseGoal(goal) {
  const cleanGoal = safeGoal(goal);
  const q = cleanGoal.toLowerCase();
  const styleId = inferStyle(cleanGoal);
  const scale = inferScale(cleanGoal);
  const isHub = /\b(hub|lobby|plaza|nexus)\b/.test(q);
  const isArena = /\b(arena|boss|combat)\b/.test(q);
  const isDungeon = /\b(dungeon|cave|facility)\b/.test(q);
  return {
    version: VERSION,
    at: nowIso(),
    goal: cleanGoal,
    styleId,
    scale,
    archetype: isArena ? 'arena' : isDungeon ? 'dungeon' : isHub ? 'hub' : 'world',
    playerFlow: {
      firstTenSeconds: 'Spawn faces the primary focal landmark, with shop/quest/portal choices readable without rotating the camera.',
      primaryLoop: isArena ? 'Spawn, read boss/arena focal point, enter combat lane, return to reward/upgrade zone.' : 'Spawn, read objective, choose a main route, interact, receive feedback, return through a loop.',
      returnLoop: 'Every main path bends back toward spawn or the focal landmark so players do not feel lost.',
    },
    keywords: q.split(/[^a-z0-9]+/).filter(Boolean).slice(0, 24),
    warnings: [],
    blockers: [],
  };
}

module.exports = { parseGoal };
