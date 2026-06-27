'use strict';

const { VERSION, ROOTS, BUILD_PHASES, SCORE_KEYS, nowIso } = require('./schema');

function createDirectorReport(lastManifest = null) {
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    status: 'ready',
    name: 'V63 Premium Director Core',
    mission: 'Plan, build, critique, optimize, playtest, and polish whole Roblox game slices with premium style direction.',
    roots: ROOTS,
    workflow: [
      'tools\\bridge.cmd premium plan "<goal>"',
      'tools\\bridge.cmd premium build "<goal>"',
      'tools\\bridge.cmd premium critique "<goal>"',
      'tools\\bridge.cmd premium qa "<goal>"',
      'tools\\bridge.cmd premium polish "<goal>"',
      'tools\\bridge.cmd premium score <manifestPath>',
    ],
    buildPhases: BUILD_PHASES,
    qualitySubScores: SCORE_KEYS,
    specialistStack: ['Build Director', 'Pro VFX', 'Animation Choreographer', 'Motion+VFX', 'Ability Forge', 'Audio Director', 'Test Pilot', 'Camera/Screen'],
    safety: {
      localFirst: true,
      fullTrustCapable: true,
      auditedMutations: true,
      blockers: ['publish/upload', 'monetization', 'DataStore/save/economy mutation', 'broad destructive wipe', 'external purchases'],
    },
    lastManifest,
    nextCommand: 'tools\\bridge.cmd premium plan "premium anime boss lobby"',
  };
}

module.exports = { createDirectorReport };
