'use strict';

const AssetForge = require('../assetforge');
const { ROOTS, SYSTEMS, VERSION, safeGoal, slugify } = require('./schema');

function compileAssetKit(goal, context = {}) {
  const clean = safeGoal(goal);
  const kit = AssetForge.createKitPlan(clean, { source: 'execution.assetkit' });
  const tx = context.transactionId;
  const base = `${ROOTS.workspace.assetForge}.Execution_${slugify(clean)}_${String(tx || 'preview').slice(-6)}`;
  const actions = [
    { type: 'folder', className: 'Folder', path: ROOTS.workspace.assetForge, role: 'root', reason: 'Codex asset forge root.' },
    { type: 'model', className: 'Model', path: base, role: 'assetKitExecution', reason: 'Codex-owned compiled asset kit marker model.' },
    { type: 'folder', className: 'Folder', path: `${base}.Families`, role: 'assetFamilies', reason: 'Reusable asset family folders.' },
    { type: 'folder', className: 'Folder', path: `${base}.MaterialSwatches`, role: 'materialSwatches', reason: 'Material sample swatches.' },
    { type: 'folder', className: 'Folder', path: `${base}.Sockets`, role: 'sockets', reason: 'Attachment/socket placeholders.' },
    { type: 'folder', className: 'Folder', path: `${base}.ManualRequiredSpecs`, role: 'manualRequiredSpecs', reason: 'Mesh/material specs that need human asset production or import.' },
  ];
  (kit.assetFamilies || []).slice(0, 12).forEach((family, index) => {
    const familyPath = `${base}.Families.${slugify(family.id || family.name || `Family${index + 1}`)}`;
    actions.push({ type: 'folder', className: 'Folder', path: familyPath, role: family.role || 'assetFamily', reason: 'V67 reusable asset family.' });
    actions.push({ type: 'part', className: 'Part', path: `${familyPath}.PrimitivePlaceholder`, role: 'primitivePlaceholder', reason: 'Primitive proxy placeholder for the family.', properties: { Size: { x: 2 + index * 0.2, y: 2, z: 2 }, Transparency: 0.28, Color: { r: 0.55, g: 0.35, b: 1 } } });
    actions.push({ type: 'createInstance', className: 'Attachment', path: `${familyPath}.Socket`, role: 'socket', reason: 'Attachment socket for VFX/audio/camera/prompt integration.' });
  });
  (kit.assetFamilies || []).slice(0, 8).forEach((family, index) => actions.push({
    type: 'part',
    className: 'Part',
    path: `${base}.MaterialSwatches.${slugify(family.material || family.id || `Swatch${index + 1}`)}`,
    role: 'materialSwatch',
    reason: 'Material/color swatch placeholder.',
    properties: { Size: { x: 2, y: 0.25, z: 2 }, Transparency: 0.05, Color: { r: 0.25 + index * 0.06, g: 0.2, b: 0.8 } },
  }));
  actions.push({ type: 'createInstance', className: 'StringValue', path: `${base}.ManualRequiredSpecs.MeshAndMaterialNotes`, role: 'manualRequiredMeshSpec', reason: 'Honest record that custom meshes/materials may require external/manual production.', value: 'Custom meshes, uploads, marketplace insertion, and paid assets are manualRequired. V72 only creates Codex-owned placeholders and manifests.' });
  return {
    ok: true,
    version: VERSION,
    goal: clean,
    system: SYSTEMS.assetkit,
    sourcePlan: 'assetforge',
    kit,
    actions,
    manualRequiredActions: [{ kind: 'customMeshOrMaterial', reason: 'Custom mesh/material upload or marketplace insertion is external/manualRequired.' }],
    manifest: { kit, basePath: base },
    warnings: ['High-fidelity custom meshes/materials are represented as safe Codex-owned placeholders until manually produced/imported.'],
    blockers: [],
  };
}

module.exports = {
  compileAssetKit,
};
