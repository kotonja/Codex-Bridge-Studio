'use strict';

function createLightingBeats(zones, style) {
  return zones.map((zone) => ({
    id: `${zone.id}_lighting`,
    zoneId: zone.id,
    role: zone.role,
    keyLight: zone.role === 'primaryFocalPoint' ? 'hero key' : 'path readable key',
    paletteHint: style.lightingLanguage[0],
    mobileFallback: 'bake with color/material contrast first; dynamic lights are optional accents.',
  }));
}

module.exports = { createLightingBeats };
