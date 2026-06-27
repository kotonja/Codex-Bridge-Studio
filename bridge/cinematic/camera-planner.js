'use strict';

const { VERSION, nowIso } = require('./schema');

function createCameraPlan(parsed, timeline) {
  const impact = timeline.animationMarkers.find((marker) => marker.name === 'Impact') || { time: 0 };
  const events = [
    { id: 'setup_lookat', time: 0, duration: 0.25, type: 'lookAt', intensity: 0.25, target: 'Camera_Focus socket or player', easing: 'SineOut', mobileFallback: 'static lookAt with no FOV movement', safety: 'codexOwnedLocalCameraRuntime' },
    { id: 'anticipation_dolly', time: Math.max(0, impact.time - 0.55), duration: 0.28, type: 'dolly', intensity: 0.35, target: 'subject center mass', easing: 'QuadOut', mobileFallback: 'reduce dolly distance by 60%', safety: 'codexOwnedLocalCameraRuntime' },
    { id: 'impact_push', time: impact.time, duration: 0.12, type: 'push', intensity: parsed.powerLevel === 'high' ? 0.78 : 0.52, target: 'Impact_Point or player target', easing: 'BackOut', mobileFallback: 'convert push to small FOV pulse', safety: 'codexOwnedLocalCameraRuntime' },
    { id: 'impact_shake', time: impact.time, duration: 0.16, type: 'shake', intensity: parsed.powerLevel === 'high' ? 0.62 : 0.35, target: 'Camera_Focus socket or player', easing: 'QuadOut', mobileFallback: 'cap amplitude at 0.18 and duration at 0.08', safety: 'codexOwnedLocalCameraRuntime' },
    { id: 'recovery_release', time: Math.max(0, parsed.durationSeconds - 0.35), duration: 0.3, type: 'release', intensity: 0, target: 'player camera', easing: 'SineOut', mobileFallback: 'same release; no residual shake', safety: 'codexOwnedLocalCameraRuntime' },
  ];
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: parsed.goal,
    cameraMode: parsed.momentType === 'cutscene' || parsed.momentType === 'bossIntro' ? 'briefCinematicOverride' : 'gameplayAssist',
    framingObjective: parsed.primaryReadabilityGoal,
    targetSubject: parsed.momentType === 'ability' ? 'attacker hand/weapon plus impact point' : 'moment focal subject',
    cframeIntent: 'socket-relative lookAt with no permanent camera ownership',
    fovChanges: [{ marker: 'Impact', from: 70, to: parsed.powerLevel === 'high' ? 62 : 66, recovery: 70 }],
    shakeEnvelope: events.filter((event) => event.type === 'shake'),
    impactPush: events.find((event) => event.id === 'impact_push'),
    recoverySmoothing: 'SineOut release to player camera; no lingering camera lock',
    mobileMotionReduction: 0.5,
    accessibilityNotes: ['cap shake intensity', 'avoid rapid alternating FOV', 'provide reduced motion fallback'],
    releaseBehavior: 'return camera to player control at Recovery/End marker',
    cameraEvents: events,
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd cinematic gamefeel "${parsed.goal}"`,
  };
}

module.exports = { createCameraPlan };
