'use strict';

const { goalId, hashGoal, safeGoal } = require('./schema');

const STYLE_HINTS = [
  ['slimeBubbleSimulator', ['slime', 'bubble', 'simulator']],
  ['sciFiHangar', ['sci-fi', 'sci fi', 'hangar', 'spaceship']],
  ['fantasyVillage', ['fantasy', 'village', 'medieval']],
  ['elementalArena', ['elemental', 'fire', 'ice', 'storm']],
  ['bossRaidTemple', ['boss', 'raid', 'temple']],
  ['portalNexus', ['portal', 'nexus']],
  ['trainingDojo', ['dojo', 'training', 'martial']],
  ['tycoonIsland', ['tycoon', 'island']],
  ['horrorFacility', ['horror', 'facility', 'lab']],
  ['underwaterCavern', ['underwater', 'cavern', 'ocean']],
  ['skyIsland', ['sky', 'cloud', 'floating']],
  ['cyberpunkCity', ['cyber', 'neon city']],
  ['cutePetPlaza', ['pet', 'cute', 'plaza']],
  ['pirateCove', ['pirate', 'cove']],
  ['desertRuins', ['desert', 'ruins']],
  ['iceCastle', ['ice', 'castle']],
  ['lavaForge', ['lava', 'forge']],
];

function chooseStyle(goal) {
  const q = safeGoal(goal).toLowerCase();
  const found = STYLE_HINTS.find(([, hints]) => hints.some((hint) => q.includes(hint)));
  return found ? found[0] : 'premiumAnimeDungeon';
}

function chooseScale(goal) {
  const q = safeGoal(goal).toLowerCase();
  if (q.includes('massive') || q.includes('huge') || q.includes('open world')) return 'massive';
  if (q.includes('large') || q.includes('city') || q.includes('raid')) return 'large';
  if (q.includes('small') || q.includes('single')) return 'small';
  return 'medium';
}

function parseGoal(goal) {
  const clean = safeGoal(goal || 'premium anime dungeon hub asset kit');
  const q = clean.toLowerCase();
  return {
    goal: clean,
    styleId: chooseStyle(clean),
    scale: chooseScale(clean),
    assetKitId: `assetkit_${goalId(clean)}_${hashGoal(clean).slice(0, 6)}`,
    needsMesh: /mesh|boss|portal|dragon|statue|vehicle|weapon|creature|arch/i.test(q),
    needsMaterial: /material|pbr|surface|texture|premium|anime|dungeon|portal|sci/i.test(q),
    needsKitbash: /kitbash|kit|props|stand|modules|assets|dungeon|hub|arena|village/i.test(q),
    needsSignage: /shop|quest|portal|hub|lobby|direction|sign/i.test(q),
    needsSockets: /vfx|audio|animation|prompt|portal|interactive|ability|boss/i.test(q) || true,
  };
}

module.exports = { parseGoal };
