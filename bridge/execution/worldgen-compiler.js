'use strict';

const Worldgen = require('../worldgen');
const { ROOTS, SYSTEMS, VERSION, safeGoal, slugify } = require('./schema');

function compileWorldgen(goal, context = {}) {
  const clean = safeGoal(goal);
  const graph = Worldgen.createLayoutGraph(clean, { source: 'execution.worldgen', ...context });
  const tx = context.transactionId;
  const base = `${ROOTS.workspace.worldgen}.Execution_${slugify(clean)}_${String(tx || 'preview').slice(-6)}`;
  const actions = [
    { type: 'folder', className: 'Folder', path: ROOTS.workspace.worldgen, role: 'root', reason: 'Codex worldgen root.' },
    { type: 'model', className: 'Model', path: base, role: 'worldgenExecution', reason: 'Codex-owned compiled world layout marker model.' },
    { type: 'folder', className: 'Folder', path: `${base}.Zones`, role: 'zones', reason: 'Zone markers compiled from V66 graph.' },
    { type: 'folder', className: 'Folder', path: `${base}.Paths`, role: 'paths', reason: 'Path markers compiled from V66 graph.' },
    { type: 'folder', className: 'Folder', path: `${base}.Landmarks`, role: 'landmarks', reason: 'Landmark placeholders compiled from V66 graph.' },
    { type: 'folder', className: 'Folder', path: `${base}.Sockets`, role: 'sockets', reason: 'VFX/audio/camera/gameplay sockets.' },
    { type: 'folder', className: 'Folder', path: `${base}.QaRoutes`, role: 'qaRoutes', reason: 'QA traversal routes.' },
  ];
  (graph.zones || []).slice(0, 10).forEach((zone, index) => actions.push({
    type: 'part',
    className: 'Part',
    path: `${base}.Zones.${slugify(zone.id || zone.role || `Zone${index + 1}`)}`,
    role: zone.role || 'zone',
    reason: 'V66 zone marker.',
    properties: { Size: { x: 8, y: 0.2, z: 8 }, Transparency: 0.45, Color: { r: 0.15 + index * 0.03, g: 0.45, b: 1 } },
  }));
  (graph.paths || []).slice(0, 12).forEach((path, index) => actions.push({
    type: 'part',
    className: 'Part',
    path: `${base}.Paths.${slugify(path.id || `Path${index + 1}`)}`,
    role: 'pathMarker',
    reason: 'V66 path marker.',
    properties: { Size: { x: 5, y: 0.15, z: 2 }, Transparency: 0.35, Color: { r: 1, g: 0.8, b: 0.1 } },
  }));
  (graph.landmarks || []).slice(0, 8).forEach((landmark, index) => actions.push({
    type: 'part',
    className: 'Part',
    path: `${base}.Landmarks.${slugify(landmark.id || `Landmark${index + 1}`)}`,
    role: landmark.role || 'landmark',
    reason: 'V66 landmark placeholder.',
    properties: { Size: { x: 3, y: 7, z: 3 }, Transparency: 0.25, Color: { r: 0.7, g: 0.2, b: 1 } },
  }));
  [...(graph.vfxSockets || []), ...(graph.audioSockets || []), ...(graph.cameraBeats || [])].slice(0, 16).forEach((socket, index) => actions.push({
    type: 'createInstance',
    className: 'Attachment',
    path: `${base}.Sockets.${slugify(socket.id || socket.role || `Socket${index + 1}`)}`,
    role: socket.role || 'socket',
    reason: 'V66 VFX/audio/camera socket marker.',
  }));
  (graph.qaRoutes || graph.paths || []).slice(0, 8).forEach((route, index) => actions.push({
    type: 'part',
    className: 'Part',
    path: `${base}.QaRoutes.${slugify(route.id || `QaRoute${index + 1}`)}`,
    role: 'qaRoute',
    reason: 'V66/V69 traversal QA route marker.',
    properties: { Size: { x: 2, y: 0.2, z: 2 }, Transparency: 0.25, Color: { r: 0.1, g: 1, b: 0.35 } },
  }));
  return {
    ok: true,
    version: VERSION,
    goal: clean,
    system: SYSTEMS.worldgen,
    sourcePlan: 'worldgen',
    graph,
    actions,
    manifest: { graph, basePath: base },
    warnings: [],
    blockers: [],
  };
}

module.exports = {
  compileWorldgen,
};
