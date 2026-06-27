'use strict';

function createLodPlan(families = []) {
  return families.map((family) => ({
    familyId: family.id,
    lods: [
      { id: 'LOD0', use: 'near hero/detail view', detail: 'full trims, sockets, optional mesh' },
      { id: 'LOD1', use: 'mid distance', detail: 'reduced trim and no small decals' },
      { id: 'LOD2', use: 'mobile/distant fallback', detail: 'primitive silhouette, simple material, no particles' },
    ],
    switchGuidance: 'Use distance, camera importance, and platform profile; do not script heavy per-frame swaps yet.',
  }));
}

module.exports = { createLodPlan };
