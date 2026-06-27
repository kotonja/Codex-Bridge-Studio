'use strict';

function createMobileMotionBudget(parsed) {
  return {
    maxCameraShakeAmplitude: 0.18,
    maxFovDelta: parsed.powerLevel === 'high' ? 6 : 4,
    maxStrongParticlesAtImpact: 35,
    maxSimultaneousTransientSounds: 3,
    reducedMotionFallback: true,
    comfortNotes: ['preserve timing and silhouette while reducing shake, bloom, and camera travel'],
  };
}

module.exports = { createMobileMotionBudget };
