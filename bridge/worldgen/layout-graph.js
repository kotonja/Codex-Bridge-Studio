'use strict';

const crypto = require('node:crypto');
const { VERSION, nowIso, safeGoal } = require('./schema');
const { getStyle } = require('./style-catalog');
const { parseGoal } = require('./goal-parser');
const { createZones } = require('./zone-planner');
const { createPaths } = require('./path-planner');
const { createLandmarks } = require('./landmark-planner');
const { createVistas, createOccluders } = require('./vista-planner');
const { createBiomes } = require('./biome-planner');
const { createEncounters } = require('./encounter-planner');
const { createLightingBeats } = require('./lighting-planner');
const { createVfxAudioSockets } = require('./vfx-audio-sockets');
const { createTraversalRoute } = require('./traversal-route');

function boundsForScale(scale) {
  if (scale === 'small') return { width: 180, depth: 180, height: 60 };
  if (scale === 'large') return { width: 360, depth: 360, height: 110 };
  if (scale === 'massive') return { width: 520, depth: 520, height: 160 };
  return { width: 256, depth: 256, height: 80 };
}

function graphId(goal) {
  return `worldgen_${crypto.createHash('sha1').update(safeGoal(goal)).digest('hex').slice(0, 10)}`;
}

function createLayoutGraph(goal, options = {}) {
  const parsed = parseGoal(goal || options.goal || options.intent);
  const style = getStyle(options.styleId || parsed.styleId);
  const { zones, omissions } = createZones(parsed);
  const paths = createPaths(zones);
  const landmarks = createLandmarks(zones, style);
  const vistas = createVistas(zones);
  const occluders = createOccluders(zones);
  const lightingBeats = createLightingBeats(zones, style);
  const biomes = createBiomes(parsed, zones);
  const encounters = createEncounters(zones);
  const sockets = createVfxAudioSockets(zones);
  const partial = { zones, goal: parsed.goal };
  const qaRoutes = createTraversalRoute(parsed.goal, partial).routes;
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: parsed.goal,
    styleId: style.id,
    scale: parsed.scale,
    graphId: graphId(parsed.goal),
    bounds: boundsForScale(parsed.scale),
    zones,
    paths,
    landmarks,
    vistas,
    occluders,
    biomes,
    encounterZones: encounters,
    lightingBeats,
    vfxSockets: sockets.vfxSockets,
    audioSockets: sockets.audioSockets,
    cameraBeats: sockets.cameraBeats,
    qaRoutes,
    omissions,
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd worldgen generate "${parsed.goal}"`,
  };
}

module.exports = { createLayoutGraph, graphId };
