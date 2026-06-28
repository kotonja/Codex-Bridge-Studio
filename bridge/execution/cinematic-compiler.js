'use strict';

const Cinematic = require('../cinematic');
const { ROOTS, SYSTEMS, VERSION, safeGoal, slugify } = require('./schema');

function compileCinematic(goal, context = {}) {
  const clean = safeGoal(goal);
  const timeline = Cinematic.createTimelinePlan(clean, { source: 'execution.cinematic.timeline' });
  const beatSheet = Cinematic.createBeatSheet(clean, { source: 'execution.cinematic.beats' });
  const camera = Cinematic.createCameraPlan(clean, { source: 'execution.cinematic.camera' });
  const tx = context.transactionId;
  const base = `${ROOTS.workspace.cinematic}.Execution_${slugify(clean)}_${String(tx || 'preview').slice(-6)}`;
  const actions = [
    { type: 'folder', className: 'Folder', path: ROOTS.workspace.cinematic, role: 'root', reason: 'Codex cinematic root.' },
    { type: 'model', className: 'Model', path: base, role: 'cinematicExecution', reason: 'Codex-owned cinematic marker package.' },
    { type: 'folder', className: 'Folder', path: `${base}.Beats`, role: 'beats', reason: 'Cinematic beat markers.' },
    { type: 'folder', className: 'Folder', path: `${base}.Camera`, role: 'camera', reason: 'Camera focus attachments and cue markers.' },
    { type: 'folder', className: 'Folder', path: `${base}.VfxAudio`, role: 'vfxAudio', reason: 'VFX/audio cue sockets.' },
    { type: 'folder', className: 'Folder', path: `${base}.GameplayWindows`, role: 'gameplayWindows', reason: 'Hit-stop, damage window, and input timing manifests.' },
  ];
  (timeline.markers || timeline.timeline || beatSheet.beats || []).slice(0, 14).forEach((beat, index) => {
    const id = beat.id || beat.marker || beat.name || beat.phase || `Beat${index + 1}`;
    actions.push({ type: 'part', className: 'Part', path: `${base}.Beats.${slugify(id)}`, role: 'cinematicBeat', reason: 'V68 cinematic beat marker.', properties: { Size: { x: 2.5, y: 0.2, z: 2.5 }, Transparency: 0.2, Color: { r: 1, g: 0.25 + index * 0.03, b: 0.2 } } });
    actions.push({ type: 'createInstance', className: 'Attachment', path: `${base}.VfxAudio.${slugify(id)}Cue`, role: 'vfxAudioCue', reason: 'VFX/audio cue attachment for cinematic marker.' });
  });
  (camera.shots || camera.cameraBeats || [{ id: 'PrimaryFocus' }]).slice(0, 6).forEach((shot, index) => {
    const id = shot.id || shot.name || `Camera${index + 1}`;
    actions.push({ type: 'createInstance', className: 'Attachment', path: `${base}.Camera.${slugify(id)}`, role: 'cameraCue', reason: 'Camera focus cue for preview and critique.' });
  });
  actions.push({ type: 'createInstance', className: 'StringValue', path: `${base}.GameplayWindows.TimingManifestJson`, role: 'timingManifest', reason: 'Serialized cinematic timing manifest.', value: JSON.stringify({ timeline, beatSheet, camera }, null, 2) });
  return {
    ok: true,
    version: VERSION,
    goal: clean,
    system: SYSTEMS.cinematic,
    sourcePlan: 'cinematic',
    timeline,
    beatSheet,
    camera,
    actions,
    manifest: { timeline, beatSheet, camera, basePath: base },
    warnings: [],
    blockers: [],
  };
}

module.exports = {
  compileCinematic,
};
