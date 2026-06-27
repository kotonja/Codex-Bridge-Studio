'use strict';

const { VERSION, nowIso } = require('./schema');
const { createMarkers } = require('./marker-planner');

function createTimeline(parsed, beatSheet) {
  const beats = beatSheet.beats;
  const animationMarkers = createMarkers(beats);
  const eventFromBeat = (beat, prefix, extra = {}) => ({
    id: `${prefix}_${beat.id}`,
    marker: beat.markers[0] || beat.id,
    time: beat.time,
    duration: beat.duration,
    beat: beat.id,
    ...extra,
  });
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: parsed.goal,
    styleId: parsed.styleId,
    momentType: parsed.momentType,
    durationSeconds: parsed.durationSeconds,
    fps: 30,
    beats,
    animationMarkers,
    vfxEvents: beats.map((beat) => eventFromBeat(beat, 'vfx', { cue: beat.vfxCue })),
    audioEvents: beats.map((beat) => eventFromBeat(beat, 'audio', { cue: beat.audioCue })),
    cameraEvents: beats.map((beat) => eventFromBeat(beat, 'camera', { cue: beat.cameraCue })),
    uiEvents: beats.filter((beat) => beat.uiCue !== 'none').map((beat) => eventFromBeat(beat, 'ui', { cue: beat.uiCue })),
    gameplayWindows: beats.filter((beat) => beat.gameplayWindow !== 'none').map((beat) => eventFromBeat(beat, 'gameplay', { window: beat.gameplayWindow })),
    budget: {
      maxCameraShakeEvents: 2,
      maxStrongVfxBursts: 2,
      maxSimultaneousAudioCues: 3,
      mobileMotionReduction: 0.5,
    },
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd cinematic generate "${parsed.goal}"`,
  };
}

module.exports = { createTimeline };
