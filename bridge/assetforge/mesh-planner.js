'use strict';

const { createSocketPlan } = require('./socket-planner');
const { createSurfaceAppearancePlan } = require('./surface-appearance-plan');

function createMeshPlan(goal, families = [], style) {
  const meshAssets = families
    .filter((family) => family.taxonomy.includes('meshNeeded'))
    .slice(0, 8)
    .map((family) => ({
      assetId: family.id,
      whyMeshNeeded: `${family.role} needs a strong custom silhouette that Roblox primitives can only approximate.`,
      fallbackPrimitivePlan: `Use layered primitives, bevel trims, and socket markers for ${family.id} until an external mesh is made.`,
      meshSpec: {
        silhouette: `${style.shapeLanguage[0]} with readable ${family.role} landmark outline`,
        dimensions: { x: 16 + family.priority * 2, y: 12 + family.priority, z: 8 + family.priority },
        partsSchema: ['hero core', 'trim rim', 'socket plates', 'collision proxy'],
        pivotRules: 'Pivot at floor center for placement and Worldgen snapping.',
        collisionProxy: 'Simple invisible box/capsule proxy; no detailed mesh collision.',
        lods: ['LOD0 hero mesh', 'LOD1 simplified silhouette', 'LOD2 primitive fallback'],
        uvNotes: 'Reserve UV islands for trims, decals, and emissive socket panels.',
        textureSlots: ['baseColor', 'normal', 'roughness', 'metalness', 'emission'],
        exportFormat: 'fbx',
        manualRequired: true,
      },
      integrationPlan: {
        targetRobloxClass: 'MeshPart',
        surfaceAppearance: true,
        materialVariantFallback: true,
        socketAttachments: createSocketPlan(goal, { familyId: family.id }).sockets.slice(0, 4),
      },
      surfaceAppearancePlan: createSurfaceAppearancePlan(family.id, style),
    }));
  return {
    ok: true,
    goal,
    meshAssets,
    manualRequired: meshAssets.length > 0,
    warnings: meshAssets.length ? ['Real custom mesh files require manual external creation/import; this plan does not fake mesh asset IDs.'] : [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd assetforge material-plan "${goal}"`,
  };
}

module.exports = { createMeshPlan };
