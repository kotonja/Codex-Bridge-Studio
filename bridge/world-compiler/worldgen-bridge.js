'use strict';

const Worldgen = require('../worldgen');

function createWorldgenBridge(goal, reconstruction) {
  const graph = Worldgen.createLayoutGraph(goal, { source: 'worldCompiler.worldgen' });
  const audit = Worldgen.createAuditReport(goal, { graph, source: 'worldCompiler.worldgen' });
  return {
    ok: true,
    version: graph.version,
    goal: graph.goal,
    graphId: graph.graphId,
    zones: graph.zones,
    paths: graph.paths,
    landmarks: graph.landmarks,
    vistas: graph.vistas,
    sockets: {
      vfx: graph.vfxSockets,
      audio: graph.audioSockets,
      camera: graph.cameraBeats,
    },
    qaRoutes: graph.qaRoutes,
    reconstructionHints: {
      floorplanId: reconstruction && reconstruction.floorplan ? reconstruction.floorplan.id : null,
      roomCount: reconstruction && reconstruction.roomGraph && Array.isArray(reconstruction.roomGraph.rooms) ? reconstruction.roomGraph.rooms.length : 0,
      collisionZoneCount: reconstruction && reconstruction.collisionZones && Array.isArray(reconstruction.collisionZones.zones) ? reconstruction.collisionZones.zones.length : 0,
    },
    audit,
    warnings: graph.warnings || [],
    blockers: graph.blockers || [],
    nextCommand: `tools\\bridge.cmd assetforge kit "${graph.goal.replace(/"/g, '\\"')}"`,
  };
}

module.exports = { createWorldgenBridge };
