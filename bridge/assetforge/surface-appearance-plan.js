'use strict';

function createSurfaceAppearancePlan(assetId, style) {
  return {
    assetId,
    surfaceAppearance: {
      baseColorMap: 'manualRequired',
      normalMap: 'manualRequired',
      roughnessMap: 'manualRequired',
      metalnessMap: 'manualRequired',
      alphaMode: 'Overlay',
      colorMapSpec: `Create a clean ${style.id} base color map with trim masks and no baked UI text.`,
      normalMapSpec: 'Add soft bevel normals for hero edges and panel trim; avoid noisy full-surface bumps.',
      roughnessMapSpec: 'Use readable roughness contrast between trim, hero face, and socket glow panels.',
      metalnessMapSpec: 'Metal only on trim/rim/fixture parts; keep readable mobile fallback.',
    },
    manualRequired: true,
    fallback: {
      material: style.materialLanguage[0] || 'Slate',
      color: { r: 110, g: 90, b: 160 },
    },
  };
}

module.exports = { createSurfaceAppearancePlan };
