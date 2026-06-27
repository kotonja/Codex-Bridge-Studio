'use strict';

const { STYLE_IDS, VERSION, goalId, hashGoal, safeGoal } = require('./schema');

function includesAny(q, words) {
  return words.some((word) => q.includes(word));
}

function chooseMomentType(q) {
  if (includesAny(q, ['boss intro', 'boss reveal', 'raid intro'])) return 'bossIntro';
  if (includesAny(q, ['cutscene', 'opening cinematic', 'intro cinematic'])) return 'cutscene';
  if (includesAny(q, ['spawn', 'arrival'])) return 'spawn';
  if (includesAny(q, ['reward', 'loot', 'claim', 'victory', 'checkpoint'])) return 'reward';
  if (includesAny(q, ['portal', 'travel', 'door'])) return 'portal';
  if (includesAny(q, ['dash', 'movement', 'run', 'jump'])) return 'movement';
  if (includesAny(q, ['ui', 'button', 'hud'])) return 'uiFeedback';
  if (includesAny(q, ['attack', 'combat', 'hit', 'slash', 'beam', 'ability', 'impact'])) return 'ability';
  return 'environmental';
}

function chooseStyle(q, momentType) {
  if (includesAny(q, ['boss intro', 'boss reveal'])) return 'animeBossIntro';
  if (includesAny(q, ['dash slash'])) return 'animeDashSlash';
  if (includesAny(q, ['slash', 'heavy attack', 'combat feel', 'powerful attack'])) return 'animeHeavyAttack';
  if (includesAny(q, ['magic girl', 'magical'])) return 'magicalGirlBurst';
  if (includesAny(q, ['ultimate', 'elemental', 'beam', 'projectile'])) return 'elementalUltimate';
  if (includesAny(q, ['reward', 'loot'])) return 'lootReveal';
  if (includesAny(q, ['simulator'])) return 'simulatorRewardBurst';
  if (includesAny(q, ['portal'])) return 'dungeonPortalOpen';
  if (includesAny(q, ['horror', 'scare'])) return 'horrorReveal';
  if (includesAny(q, ['sci-fi', 'scifi', 'door'])) return 'sciFiDoorOpen';
  if (includesAny(q, ['glitch', 'cyberpunk'])) return 'cyberpunkGlitch';
  if (includesAny(q, ['dojo', 'training', 'combo'])) return 'trainingDojoCombo';
  if (includesAny(q, ['pet summon'])) return 'petSummon';
  if (includesAny(q, ['checkpoint', 'obby'])) return 'obbyCheckpointVictory';
  if (includesAny(q, ['spawn', 'arrival'])) return 'cinematicSpawnArrival';
  if (includesAny(q, ['round start', 'arena'])) return 'arenaRoundStart';
  if (momentType === 'portal') return 'portalTravel';
  return STYLE_IDS.includes(momentType) ? momentType : 'animeHeavyAttack';
}

function durationFor(momentType, q) {
  if (includesAny(q, ['short', 'snappy'])) return 1.6;
  if (includesAny(q, ['ultimate', 'cinematic', 'boss intro', 'opening'])) return 4.2;
  if (momentType === 'uiFeedback' || momentType === 'reward') return 1.4;
  if (momentType === 'portal' || momentType === 'spawn') return 3.2;
  return 2.6;
}

function parseGoal(goal) {
  const clean = safeGoal(goal);
  const q = clean.toLowerCase();
  const momentType = chooseMomentType(q);
  const styleId = chooseStyle(q, momentType);
  const durationSeconds = durationFor(momentType, q);
  return {
    ok: true,
    version: VERSION,
    goal: clean,
    goalId: goalId(clean),
    packageId: `cinematic_${goalId(clean)}_${hashGoal(clean).slice(0, 6)}`,
    styleId,
    momentType,
    durationSeconds,
    qualityTarget: 'premium',
    powerLevel: includesAny(q, ['ultimate', 'boss', 'heavy', 'powerful']) ? 'high' : 'medium',
    primaryReadabilityGoal: momentType === 'ability'
      ? 'The player must understand windup, contact, impact, and recovery without reading code.'
      : 'The moment must communicate its purpose in one glance while preserving player comfort.',
  };
}

module.exports = { parseGoal };
