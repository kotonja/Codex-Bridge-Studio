'use strict';

function createUiPunchPlan(parsed, timeline) {
  const impact = timeline.animationMarkers.find((marker) => marker.name === 'Impact') || { time: 0 };
  return {
    cues: [
      { id: 'impact_label_pulse', marker: 'Impact', time: impact.time, action: 'scale 1.0 -> 1.08 -> 1.0', duration: 0.18, mobileFallback: 'scale 1.04 max' },
      { id: 'readiness_return', marker: 'Recovery', time: timeline.animationMarkers.find((m) => m.name === 'Recovery')?.time || parsed.durationSeconds, action: 'show cooldown/readiness state', duration: 0.25, mobileFallback: 'simple color/alpha state' },
    ],
    rules: ['do not cover gameplay target', 'keep text readable', 'one punch per major beat'],
  };
}

module.exports = { createUiPunchPlan };
