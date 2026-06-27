'use strict';

const { REQUIRED_MARKERS, VERSION, nowIso } = require('./schema');

function createAnimationPlan(parsed, timeline) {
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: parsed.goal,
    styleId: parsed.styleId,
    momentType: parsed.momentType,
    rigAssumptions: ['R15 Humanoid or AnimationConstraint rig preferred', 'Motor6D/Bone fallback supported by V40/V53 planners', 'custom rigs require joint map validation'],
    posePhases: timeline.beats.map((beat) => ({ beat: beat.id, time: beat.time, pose: beat.animationPose, readabilityRisk: beat.readabilityRisk })),
    timingPhases: timeline.beats.map((beat) => ({ beat: beat.id, start: beat.time, duration: beat.duration })),
    markerNames: REQUIRED_MARKERS,
    markerTimes: Object.fromEntries(timeline.animationMarkers.map((marker) => [marker.name, marker.time])),
    loop: false,
    prioritySuggestion: parsed.momentType === 'ability' || parsed.momentType === 'combat' ? 'Action4' : 'Action',
    retargetingNotes: ['Keep torso/hips readable before arms/VFX', 'Use left/right mirror variants only after marker timing is locked', 'Do not upload animation assets automatically'],
    manualRequired: true,
    manualRequiredReason: 'Roblox animation upload/publish requires creator-controlled Studio/Roblox flow; V68 only creates local specs/manifests unless an existing safe generated animation path is supplied.',
    localKeyframeSpecFallback: {
      available: true,
      command: `tools\\bridge.cmd animation choreograph <rigPath> "${parsed.goal}"`,
      outputScope: 'ReplicatedStorage.GeneratedAnimations versioned KeyframeSequence when run through animation workbench',
    },
    syncMarkers: timeline.animationMarkers,
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd cinematic vfx-sync "${parsed.goal}"`,
  };
}

module.exports = { createAnimationPlan };
