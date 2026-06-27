'use strict';

const { VERSION, VFX_ROLES, nowIso } = require('./schema');

const markerByRole = {
  charge: 'Anticipation',
  trail: 'Windup',
  flash: 'Contact',
  burst: 'Impact',
  debris: 'Impact',
  smoke: 'FollowThrough',
  'lingering aura': 'Recovery',
  cleanup: 'End',
};

function createVfxSyncPlan(parsed, timeline) {
  const markerTimes = Object.fromEntries(timeline.animationMarkers.map((marker) => [marker.name, marker.time]));
  const cues = VFX_ROLES.map((role) => {
    const marker = markerByRole[role] || 'Impact';
    return {
      role,
      marker,
      time: markerTimes[marker] ?? 0,
      targetSocket: role === 'trail' ? 'Weapon_Trail or Hand_Trail' : role === 'burst' ? 'Impact_Point' : role === 'charge' ? 'Hand_Charge or Body_Aura' : 'Cinematic_Focus',
      vfxPackageSuggestion: `tools\\bridge.cmd vfx pro-plan "${parsed.goal} ${role}"`,
      intensity: role === 'burst' || role === 'flash' ? 'high' : role === 'cleanup' ? 'low' : 'medium',
      mobileFallback: role === 'debris' || role === 'smoke' ? 'reduce particle count by 50%' : 'reduce brightness/overdraw, keep timing',
      command: `tools\\bridge.cmd vfx animate <presetPath> <animationPath>`,
    };
  });
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: parsed.goal,
    cues,
    markerMap: markerByRole,
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd cinematic audio-sync "${parsed.goal}"`,
  };
}

module.exports = { createVfxSyncPlan };
