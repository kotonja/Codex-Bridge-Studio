'use strict';

const { REQUIRED_MARKERS } = require('./schema');

function markerTime(beats, marker) {
  const wanted = marker.toLowerCase();
  const beat = beats.find((entry) => entry.id.toLowerCase() === wanted || entry.markers.some((m) => m.toLowerCase() === wanted));
  if (beat) return beat.time;
  if (marker === 'End') return beats[beats.length - 1]?.time || 0;
  return 0;
}

function createMarkers(beats) {
  return REQUIRED_MARKERS.map((name) => ({
    name,
    time: markerTime(beats, name),
    purpose: name === 'Impact' ? 'primary readability and feedback moment' : `${name} sync point`,
    syncedSystems: ['animation', 'vfx', 'audio', 'camera', 'gameplay'],
  }));
}

module.exports = { createMarkers };
