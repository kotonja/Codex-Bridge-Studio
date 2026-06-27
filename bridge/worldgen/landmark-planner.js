'use strict';

function createLandmarks(zones, style) {
  return zones
    .filter((zone) => ['primaryFocalPoint', 'portal', 'shop', 'quest', 'bossPreview', 'vista'].includes(zone.role))
    .map((zone) => ({
      id: `${zone.id}_landmark`,
      zoneId: zone.id,
      role: zone.role === 'primaryFocalPoint' ? 'primary' : 'secondary',
      silhouette: zone.role === 'primaryFocalPoint' ? 'tall hero form with readable negative space' : 'medium icon silhouette',
      materialCue: style.materialLanguage[0],
      visibilityFromSpawn: ['primaryFocalPoint', 'shop', 'quest', 'portal'].includes(zone.role),
      suggestedCommand: `tools\\bridge.cmd build generate "${zone.role} landmark for ${style.id}"`,
    }));
}

module.exports = { createLandmarks };
