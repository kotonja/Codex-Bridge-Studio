'use strict';

function createAbilityWindowPlan(parsed, timeline) {
  const markerTime = Object.fromEntries(timeline.animationMarkers.map((marker) => [marker.name, marker.time]));
  return {
    windows: [
      { id: 'inputBuffer', marker: 'Windup', start: markerTime.Windup ?? 0, duration: 0.2, purpose: 'allow responsive chaining without hiding anticipation' },
      { id: 'damageWindow', marker: 'Impact', start: markerTime.Impact ?? 0, duration: 0.12, purpose: 'align hitbox with VFX/audio/camera impact' },
      { id: 'recoveryLock', marker: 'Recovery', start: markerTime.Recovery ?? parsed.durationSeconds, duration: 0.18, purpose: 'prevent instant spam while clearly returning control' },
    ],
    policy: 'local ability package timing only; no production combat framework mutation',
  };
}

module.exports = { createAbilityWindowPlan };
