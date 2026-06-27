'use strict';

function createVistas(zones) {
  const spawn = zones.find((zone) => zone.id === 'spawn');
  const primary = zones.find((zone) => zone.id === 'primary_focal');
  const portal = zones.find((zone) => zone.id === 'portal_nexus') || primary;
  return [
    {
      id: 'spawn_reveal_vista',
      from: spawn ? spawn.id : 'spawn',
      to: primary ? primary.id : 'primary_focal',
      purpose: 'First camera cone sells the premium promise immediately.',
      occlusionRule: 'Keep the lower third open and use side props as framing, not blockage.',
    },
    {
      id: 'return_loop_vista',
      from: portal ? portal.id : 'portal_nexus',
      to: spawn ? spawn.id : 'spawn',
      purpose: 'Players can find their way back without a map.',
      occlusionRule: 'Use height changes and light color to point back toward spawn.',
    },
  ];
}

function createOccluders(zones) {
  return zones
    .filter((zone) => ['shop', 'quest', 'combat', 'social'].includes(zone.role))
    .map((zone) => ({
      id: `${zone.id}_soft_occluder`,
      zoneId: zone.id,
      type: 'softFrame',
      purpose: 'Frame the route and hide clutter without blocking landmark readability.',
      maxHeight: zone.role === 'combat' ? 20 : 14,
    }));
}

module.exports = { createOccluders, createVistas };
