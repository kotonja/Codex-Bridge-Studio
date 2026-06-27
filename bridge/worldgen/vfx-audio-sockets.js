'use strict';

function collectSockets(zones, kind) {
  return zones.flatMap((zone) => (zone.sockets || [])
    .filter((socket) => socket.type === kind)
    .map((socket) => ({ ...socket, zoneId: zone.id, position: zone.position })));
}

function createVfxAudioSockets(zones) {
  const vfxSockets = collectSockets(zones, 'vfx');
  const audioSockets = collectSockets(zones, 'audio');
  return {
    vfxSockets,
    audioSockets,
    cameraBeats: zones
      .filter((zone) => ['spawn', 'primaryFocalPoint', 'portal', 'shop', 'quest'].includes(zone.role))
      .map((zone) => ({ id: `${zone.id}_camera_beat`, zoneId: zone.id, purpose: 'Frame for screenshot critique and player orientation.', position: zone.position })),
  };
}

module.exports = { createVfxAudioSockets };
