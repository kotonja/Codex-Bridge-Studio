'use strict';

function point(zone) {
  return zone ? zone.position : { x: 0, y: 0, z: 0 };
}

function createPath(id, from, to, type, width, zones) {
  const a = zones.find((zone) => zone.id === from);
  const b = zones.find((zone) => zone.id === to);
  const pa = point(a);
  const pb = point(b);
  return {
    id,
    from,
    to,
    type,
    width,
    landmarkVisibility: ['main', 'tutorial', 'return'].includes(type),
    waypoints: [
      pa,
      { x: Math.round((pa.x + pb.x) / 2), y: Math.max(pa.y, pb.y), z: Math.round((pa.z + pb.z) / 2) },
      pb,
    ],
  };
}

function createPaths(zones) {
  const ids = new Set(zones.map((zone) => zone.id));
  const specs = [
    ['spawn_to_primary_focal', 'spawn', 'primary_focal', 'main', 22],
    ['spawn_to_shop', 'spawn', 'shop', 'secondary', 18],
    ['spawn_to_quest', 'spawn', 'quest', 'secondary', 18],
    ['primary_to_portal', 'primary_focal', 'portal_nexus', 'main', 20],
    ['spawn_to_training', 'spawn', 'training', 'tutorial', 18],
    ['spawn_to_social', 'spawn', 'social', 'secondary', 16],
    ['primary_to_combat', 'primary_focal', 'combat', 'main', 20],
    ['primary_to_boss_preview', 'primary_focal', 'boss_preview', 'secondary', 18],
    ['secret_return', 'secret', 'spawn', 'secret', 12],
    ['reward_return', 'reward', 'spawn', 'return', 18],
  ];
  return specs
    .filter(([, from, to]) => ids.has(from) && ids.has(to))
    .map(([id, from, to, type, width]) => createPath(id, from, to, type, width, zones));
}

module.exports = { createPaths };
