'use strict';

const { BEAT_CONCEPTS } = require('./schema');
const { timeAt, timingFractions } = require('./timing-language');

const purposes = {
  setup: 'orient the player and show the subject',
  anticipation: 'prepare the eye before motion starts',
  windup: 'make the action readable before commitment',
  contact: 'show the exact moment of connection or activation',
  impact: 'sell success, danger, or transformation',
  hold: 'let the important frame read',
  release: 'push energy outward through VFX/audio/camera',
  followThrough: 'show weight and direction after the hit',
  recovery: 'return control/readiness clearly',
  rewardReadability: 'confirm outcome and leave a readable final state',
};

function createBeatSheet(parsed, style) {
  const fractions = timingFractions(parsed.momentType);
  const beats = BEAT_CONCEPTS.map((id, index) => {
    const time = timeAt(parsed.durationSeconds, fractions[index] ?? (index / (BEAT_CONCEPTS.length - 1)));
    const next = timeAt(parsed.durationSeconds, fractions[index + 1] ?? 1);
    const duration = Math.max(0.08, Number((next - time).toFixed(2)));
    const marker = id === 'rewardReadability' ? 'End' : id === 'followThrough' ? 'FollowThrough' : id[0].toUpperCase() + id.slice(1);
    return {
      id,
      time,
      duration,
      purpose: purposes[id],
      animationPose: `${style.animationLanguage[0]} during ${id}`,
      vfxCue: id === 'impact' ? 'burst + flash + debris' : id === 'anticipation' ? 'charge glow' : id === 'recovery' ? 'cleanup residue' : 'supporting timed layer',
      audioCue: id === 'impact' ? 'impact_hit + bass_punch' : id === 'windup' ? 'movement_whoosh' : id === 'rewardReadability' ? 'reward_stinger' : 'subtle cue',
      cameraCue: id === 'impact' ? 'impact push/shake envelope' : id === 'setup' ? 'lookAt framing' : id === 'recovery' ? 'release smoothing' : 'stable framing',
      uiCue: id === 'impact' ? 'brief punch feedback' : id === 'recovery' ? 'cooldown/readiness state' : 'none',
      gameplayWindow: id === 'impact' ? 'damage' : id === 'windup' ? 'inputBuffer' : id === 'hold' ? 'invulnerable' : 'none',
      readabilityRisk: id === 'impact' || id === 'windup' ? 'medium' : 'low',
      mobileFallback: id === 'impact' ? 'halve shake amplitude and keep the frame hold' : 'preserve timing with lower visual amplitude',
      markers: marker === 'End' ? ['End'] : [marker, id === 'impact' ? 'VFX_Burst' : `VFX_${marker}`, id === 'impact' ? 'Audio_Hit' : `Audio_${marker}`, id === 'impact' ? 'Camera_Shake' : `Camera_${marker}`],
    };
  });
  return {
    ok: true,
    goal: parsed.goal,
    styleId: parsed.styleId,
    momentType: parsed.momentType,
    durationSeconds: parsed.durationSeconds,
    beats,
    omittedBeats: [],
  };
}

module.exports = { createBeatSheet };
