'use strict';

function createHitStopPlan(parsed, timeline) {
  const impact = timeline.animationMarkers.find((marker) => marker.name === 'Impact') || { time: 0 };
  return {
    marker: 'Impact',
    time: impact.time,
    duration: parsed.powerLevel === 'high' ? 0.075 : 0.045,
    mode: 'manifestOnly',
    manualRequired: true,
    reason: 'Only plan local ability windows or visual freeze effects unless an existing safe runtime harness explicitly supports local hit-stop.',
    hardRules: ['never freeze Studio/editor', 'never globally pause unrelated systems', 'never affect saves/economy/DataStore'],
  };
}

module.exports = { createHitStopPlan };
