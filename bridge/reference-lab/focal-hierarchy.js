'use strict';

function createFocalHierarchy(ctx) {
  return [
    { rank: 1, target: ctx.isDungeon ? 'portal/gate core' : 'main hub landmark', reason: 'Primary identity and navigation anchor.', treatment: 'largest silhouette, strongest glow, clean surrounding negative space' },
    { rank: 2, target: 'main path / spawn line', reason: 'Player must know where to walk first.', treatment: 'wide readable path, directional trim, low clutter' },
    { rank: 3, target: 'side interactables', reason: 'Shops, quests, leaderboards, portals support retention.', treatment: 'consistent signs, color-coded pads, icon clarity' },
    { rank: 4, target: 'ambient detail', reason: 'Adds premium density without stealing readability.', treatment: 'small-medium props, particles, trim rhythm, strict budget' },
  ];
}

module.exports = {
  createFocalHierarchy,
};
