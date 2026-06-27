'use strict';

function createBiomes(parsed, zones) {
  return zones.map((zone) => ({
    id: `${zone.id}_biome`,
    zoneId: zone.id,
    biome: zone.role === 'spawn' ? 'safe arrival' : zone.role === 'combat' ? 'high contrast action' : zone.role === 'portal' ? 'destination energy' : `${parsed.styleId} accent`,
    materialAccent: zone.role === 'primaryFocalPoint' ? 'hero trim' : 'supporting trim',
  }));
}

module.exports = { createBiomes };
