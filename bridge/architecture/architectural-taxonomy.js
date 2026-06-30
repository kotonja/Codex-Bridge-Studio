'use strict';

function createTaxonomy() {
  return {
    modules: ['portal', 'arch', 'wallBay', 'roofCap', 'doorFrame', 'windowFrame', 'pillar', 'stair', 'interiorRoom', 'trimBand', 'depthLayer'],
    roles: ['primarySilhouette', 'secondarySupport', 'navigationReadability', 'socketAnchor', 'collisionProxy', 'mobileFallback'],
    cheapPatterns: ['single flat slab', 'random block pile', 'tiny unreadable rivets', 'unbudgeted transparent clutter'],
    nextCommand: 'tools\\bridge.cmd architecture grammar "dark purple anime dungeon gate"',
  };
}

module.exports = { createTaxonomy };
