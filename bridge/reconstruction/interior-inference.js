'use strict';

const { confidenceFromEvidence } = require('./confidence');
const { inferenceItem } = require('./schema');

function createInteriorPlan(ctx) {
  const q = ctx.goal.toLowerCase();
  const hasPortal = /portal|gate|rift/.test(q);
  const hasDungeon = /dungeon|mansion|castle|temple|boss/.test(q);
  const evidence = ctx.sourceEvidence;
  const baseConfidence = confidenceFromEvidence(evidence, hasDungeon ? 0.56 : 0.5, { referenceLabReport: true, noteOnly: !ctx.actualVisionUsed, interiorFromExterior: true });
  const rooms = [
    {
      id: 'entry_foyer',
      name: hasDungeon ? 'Shadow Entry Foyer' : 'Entry Foyer',
      role: 'foyer',
      approxSize: { x: 32, y: 18, z: 24 },
      adjacentTo: ['primary_hall'],
      entryPoints: ['front_door'],
      exits: ['primary_hall'],
      gameplayUse: 'First readable decompression space after entering; frames the main objective and prevents players from spawning into clutter.',
      assetNeeds: ['hero threshold trim', 'floor medallion', 'readable sign or portal label'],
      lightingNeeds: ['warm rim light at entrance', 'cool focal glow deeper inside'],
      vfxNeeds: hasPortal ? ['subtle portal spill light', 'ambient drifting particles'] : ['ambient dust motes'],
      qaRisks: ['entry may feel empty if no first objective marker exists'],
      confidence: baseConfidence,
    },
    {
      id: 'primary_hall',
      name: hasDungeon ? 'Main Dungeon Hall' : 'Primary Hall',
      role: hasPortal ? 'portal' : 'hallway',
      approxSize: { x: 54, y: 24, z: 42 },
      adjacentTo: ['entry_foyer', 'side_shop', 'quest_room', 'reward_room'],
      entryPoints: ['entry_foyer'],
      exits: ['portal_threshold', 'side_shop', 'quest_room', 'reward_room'],
      gameplayUse: 'Main navigation and focal reveal space; player should understand where to go within five seconds.',
      assetNeeds: ['large arch modules', 'floor lane inlay', 'portal frame sockets', 'side wall panels'],
      lightingNeeds: ['strong central glow', 'side-room contrast lights'],
      vfxNeeds: hasPortal ? ['portal core', 'edge wisps', 'activation runes'] : ['focal sparkle layer'],
      qaRisks: ['too many side props can hide exits on mobile'],
      confidence: baseConfidence,
    },
    {
      id: 'side_shop',
      name: 'Side Shop Alcove',
      role: 'shop',
      approxSize: { x: 24, y: 14, z: 18 },
      adjacentTo: ['primary_hall'],
      entryPoints: ['primary_hall'],
      exits: ['primary_hall'],
      gameplayUse: 'Optional economy/menu stop placed off the main line so it does not block new-player flow.',
      assetNeeds: ['vendor counter', 'small signs', 'item display sockets'],
      lightingNeeds: ['friendly accent light'],
      vfxNeeds: ['small idle glints'],
      qaRisks: ['shop trigger must not overlap main path'],
      confidence: confidenceFromEvidence(evidence, 0.5, { referenceLabReport: true, noteOnly: !ctx.actualVisionUsed }),
    },
    {
      id: 'quest_room',
      name: 'Quest/NPC Side Room',
      role: 'quest',
      approxSize: { x: 26, y: 14, z: 20 },
      adjacentTo: ['primary_hall'],
      entryPoints: ['primary_hall'],
      exits: ['primary_hall'],
      gameplayUse: 'NPC or tutorial objective room that gives purpose before the portal/combat destination.',
      assetNeeds: ['NPC platform', 'quest marker socket', 'wall banner'],
      lightingNeeds: ['NPC key light'],
      vfxNeeds: ['quest marker pulse'],
      qaRisks: ['quest prompt can be missed if silhouette is weak'],
      confidence: confidenceFromEvidence(evidence, 0.47, { referenceLabReport: true, noteOnly: !ctx.actualVisionUsed, interiorFromExterior: true }),
    },
    {
      id: 'reward_room',
      name: 'Reward/Return Alcove',
      role: 'reward',
      approxSize: { x: 24, y: 14, z: 18 },
      adjacentTo: ['primary_hall'],
      entryPoints: ['primary_hall'],
      exits: ['primary_hall'],
      gameplayUse: 'Return-loop reward chest, leaderboard, or completion flourish space.',
      assetNeeds: ['chest pedestal', 'reward glow socket'],
      lightingNeeds: ['gold/bright accent'],
      vfxNeeds: ['reward burst anchor'],
      qaRisks: ['reward space must not look like the primary objective before it unlocks'],
      confidence: confidenceFromEvidence(evidence, 0.46, { referenceLabReport: true, noteOnly: !ctx.actualVisionUsed, interiorFromExterior: true }),
    },
  ];

  const verticalLinks = hasDungeon ? [
    {
      id: 'upper_balcony_stairs',
      type: 'stair',
      from: 'primary_hall',
      to: 'upper_balcony',
      purpose: 'Optional vista/readability layer and future expansion route.',
      confidence: confidenceFromEvidence(evidence, 0.42, { unseenSide: true, interiorFromExterior: true }),
    },
  ] : [];

  const inferences = [
    inferenceItem('interior.entry_foyer', 'Add an entry foyer behind the visible facade.', 'Exterior gates need a decompression space so players do not enter directly into a confusing hub.', baseConfidence, {
      sourceEvidence: evidence,
      alternatives: ['short vestibule', 'open-air courtyard entry'],
    }),
    inferenceItem('interior.primary_hall', 'Use a primary hall aligned to the hero gate/portal axis.', 'The visible focal point implies a straight readable path and a centered reveal.', baseConfidence, {
      sourceEvidence: evidence,
      alternatives: ['circular rotunda', 'T-shaped lobby'],
    }),
    inferenceItem('interior.side_rooms', 'Place shop, quest, and reward alcoves off the main hall.', 'Side functions should be accessible but not block the first objective route.', 0.5, {
      sourceEvidence: evidence,
      risk: 'medium',
      alternatives: ['separate exterior kiosks', 'upper balcony services'],
    }),
  ];

  return {
    summary: 'Exterior-to-interior inference keeps the front silhouette readable while adding playable rooms behind it.',
    rooms,
    verticalLinks,
    inaccessibleSpaces: [
      { id: 'decorative_outer_shell', reason: 'Keep decorative facade thickness blocked so players do not clip into trim/roof geometry.', confidence: 0.72 },
      { id: 'vfx_core_volume', reason: 'Portal/VFX core should usually be no-collision and protected by an activation pad or invisible barrier.', confidence: hasPortal ? 0.7 : 0.48 },
    ],
    inferences,
    confidence: baseConfidence,
  };
}

module.exports = {
  createInteriorPlan,
};

