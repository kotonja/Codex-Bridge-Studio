'use strict';

const TAXONOMY = [
  'facade',
  'sideWall',
  'backWall',
  'roof',
  'entrance',
  'doorway',
  'window',
  'hallway',
  'room',
  'stair',
  'elevator',
  'balcony',
  'basement',
  'courtyard',
  'tower',
  'bridge',
  'platform',
  'portal',
  'shop',
  'questArea',
  'combatArea',
  'socialArea',
  'rewardArea',
  'secretArea',
  'blockedDecoration',
  'collisionOnly',
  'vistaOnly',
];

function classifyGoal(goal = '') {
  const q = String(goal || '').toLowerCase();
  const tags = new Set(['facade', 'entrance', 'room']);
  if (/gate|portal/.test(q)) tags.add('portal');
  if (/dungeon|mansion|castle|temple|building|hub/.test(q)) tags.add('hallway');
  if (/tower/.test(q)) tags.add('tower');
  if (/bridge/.test(q)) tags.add('bridge');
  if (/shop|merchant|store/.test(q)) tags.add('shop');
  if (/quest|npc/.test(q)) tags.add('questArea');
  if (/boss|combat|arena|enemy/.test(q)) tags.add('combatArea');
  if (/reward|chest|loot/.test(q)) tags.add('rewardArea');
  if (/secret|hidden/.test(q)) tags.add('secretArea');
  if (/stairs|stair|floor|upper|basement|vertical/.test(q)) tags.add('stair');
  return Array.from(tags).filter((tag) => TAXONOMY.includes(tag));
}

module.exports = {
  TAXONOMY,
  classifyGoal,
};

