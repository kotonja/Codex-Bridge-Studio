'use strict';

function createEncounters(zones) {
  return zones
    .filter((zone) => ['combat', 'training', 'bossPreview', 'event'].includes(zone.role))
    .map((zone) => ({
      id: `${zone.id}_encounter`,
      zoneId: zone.id,
      encounterType: zone.role === 'bossPreview' ? 'telegraph preview' : zone.role === 'training' ? 'practice dummy' : 'lightweight test encounter',
      safety: 'no production combat scripts; sockets only',
      expectedPlayerRead: 'Threat or interaction is visible before the player enters the zone.',
    }));
}

module.exports = { createEncounters };
