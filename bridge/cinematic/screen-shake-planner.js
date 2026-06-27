'use strict';

function createScreenShakePlan(parsed, timeline) {
  const impact = timeline.animationMarkers.find((marker) => marker.name === 'Impact') || { time: 0 };
  return {
    envelope: {
      marker: 'Impact',
      time: impact.time,
      amplitude: parsed.powerLevel === 'high' ? 0.6 : 0.35,
      frequency: parsed.powerLevel === 'high' ? 18 : 12,
      duration: parsed.powerLevel === 'high' ? 0.16 : 0.1,
      decay: 'fast exponential',
    },
    discipline: ['one impulse per impact', 'no looping shake', 'mobile amplitude cap 0.18', 'accessibility reduced-motion fallback'],
  };
}

module.exports = { createScreenShakePlan };
