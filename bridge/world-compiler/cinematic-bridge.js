'use strict';

const Cinematic = require('../cinematic');

function createCinematicBridge(goal, reference, worldgen) {
  return {
    ok: true,
    version: Cinematic.VERSION,
    goal,
    intentPlan: Cinematic.createIntentPlan(goal, { source: 'worldCompiler.cinematic' }),
    timeline: Cinematic.createTimelinePlan(goal, { source: 'worldCompiler.cinematic' }),
    beats: Cinematic.createBeatSheet(goal, { source: 'worldCompiler.cinematic' }),
    camera: Cinematic.createCameraPlan(goal, { source: 'worldCompiler.cinematic' }),
    vfxSync: Cinematic.createVfxSyncPlan(goal, { source: 'worldCompiler.cinematic' }),
    audioSync: Cinematic.createAudioSyncPlan(goal, { source: 'worldCompiler.cinematic' }),
    moodSignals: reference && reference.styleProfile ? reference.styleProfile.mood || [] : [],
    worldCameraSockets: worldgen && worldgen.sockets ? worldgen.sockets.camera || [] : [],
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd qa launch "${goal.replace(/"/g, '\\"')}"`,
  };
}

module.exports = { createCinematicBridge };
