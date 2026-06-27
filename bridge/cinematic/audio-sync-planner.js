'use strict';

const { AUDIO_ROLES, VERSION, nowIso } = require('./schema');

const roleMarkers = {
  charge_riser: 'Anticipation',
  movement_whoosh: 'Windup',
  impact_hit: 'Impact',
  bass_punch: 'Impact',
  magic_sparkle: 'Release',
  debris: 'FollowThrough',
  reward_stinger: 'End',
  ambience_duck: 'Start',
};

function createAudioSyncPlan(parsed, timeline) {
  const markerTimes = Object.fromEntries(timeline.animationMarkers.map((marker) => [marker.name, marker.time]));
  const cues = AUDIO_ROLES.map((role) => {
    const marker = roleMarkers[role] || 'Impact';
    return {
      role,
      marker,
      time: markerTimes[marker] ?? 0,
      soundSpec: {
        description: `${role.replace(/_/g, ' ')} for ${parsed.goal}`,
        assetId: null,
        fakeAssetId: false,
      },
      SoundGroup: role === 'ambience_duck' ? 'Ambience' : role.includes('impact') || role.includes('bass') ? 'Combat' : 'Abilities',
      volumeTarget: role === 'bass_punch' ? 0.7 : role === 'ambience_duck' ? 0.35 : 0.55,
      pitchRange: role === 'impact_hit' ? [0.92, 1.04] : [0.98, 1.08],
      duckingPlan: role === 'ambience_duck' ? 'duck ambience 2-4 dB during setup/impact, restore during recovery' : 'no global duck; keep transient clean',
      manualRequired: true,
      manualRequiredReason: 'No existing sound asset was selected; V68 will not invent or upload audio asset IDs.',
      fallbackPlaceholder: 'manifest-only cue until an existing Sound or approved asset id is supplied',
    };
  });
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: parsed.goal,
    cues,
    warnings: ['Audio cues are specs only until existing game sounds or creator-approved asset IDs are provided.'],
    blockers: [],
    nextCommand: `tools\\bridge.cmd cinematic camera "${parsed.goal}"`,
  };
}

module.exports = { createAudioSyncPlan };
