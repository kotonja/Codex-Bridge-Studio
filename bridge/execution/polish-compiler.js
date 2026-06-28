'use strict';

const Visual = require('../visual');
const Worldgen = require('../worldgen');
const AssetForge = require('../assetforge');
const Cinematic = require('../cinematic');
const Autopilot = require('../autopilot');
const { ROOTS, SYSTEMS, VERSION, safeGoal, slugify } = require('./schema');

function compilePolish(goal, context = {}) {
  const clean = safeGoal(goal);
  const visual = Visual.createCritiqueReport(clean, { source: 'execution.polish.visual' });
  const worldgen = Worldgen.createPolishPlan(clean, Worldgen.createAuditReport(clean));
  const assetforge = AssetForge.createPolishPlan(clean);
  const cinematic = Cinematic.createPolishPlan(clean);
  const autopilot = Autopilot.createPolishPlan(clean);
  const tx = context.transactionId;
  const base = `${ROOTS.workspace.autopilot}.ExecutionPolish_${slugify(clean)}_${String(tx || 'preview').slice(-6)}`;
  const actions = [
    { type: 'folder', className: 'Folder', path: ROOTS.workspace.autopilot, role: 'root', reason: 'Codex Autopilot root.' },
    { type: 'model', className: 'Model', path: base, role: 'polishExecution', reason: 'Codex-owned polish marker package.' },
    { type: 'folder', className: 'Folder', path: `${base}.Visual`, role: 'visualPolish', reason: 'Visual critique/polish markers.' },
    { type: 'folder', className: 'Folder', path: `${base}.Worldgen`, role: 'worldgenPolish', reason: 'World polish markers.' },
    { type: 'folder', className: 'Folder', path: `${base}.AssetForge`, role: 'assetPolish', reason: 'Asset polish markers.' },
    { type: 'folder', className: 'Folder', path: `${base}.Cinematic`, role: 'cinematicPolish', reason: 'Cinematic polish markers.' },
    { type: 'createInstance', className: 'StringValue', path: `${base}.Visual.VisualCritiqueJson`, role: 'visualCritique', reason: 'Serialized visual critique for follow-up.', value: JSON.stringify(visual, null, 2) },
    { type: 'createInstance', className: 'StringValue', path: `${base}.Worldgen.WorldgenPolishJson`, role: 'worldgenPolishManifest', reason: 'Serialized worldgen polish plan.', value: JSON.stringify(worldgen, null, 2) },
    { type: 'createInstance', className: 'StringValue', path: `${base}.AssetForge.AssetPolishJson`, role: 'assetPolishManifest', reason: 'Serialized asset forge polish plan.', value: JSON.stringify(assetforge, null, 2) },
    { type: 'createInstance', className: 'StringValue', path: `${base}.Cinematic.CinematicPolishJson`, role: 'cinematicPolishManifest', reason: 'Serialized cinematic polish plan.', value: JSON.stringify(cinematic, null, 2) },
  ];
  return {
    ok: true,
    version: VERSION,
    goal: clean,
    system: SYSTEMS.polish,
    sourcePlan: 'polish',
    visual,
    worldgen,
    assetforge,
    cinematic,
    autopilot,
    actions,
    manifest: { visual, worldgen, assetforge, cinematic, autopilot, basePath: base },
    warnings: ['Polish execution creates Codex-owned markers/manifests only; production edits remain manualRequired unless routed through safe patch systems.'],
    blockers: [],
  };
}

module.exports = {
  compilePolish,
};
