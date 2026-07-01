'use strict';

function createSurfaceAppearanceSpec(goal, parsed = {}) {
  return {
    action: 'surfaceAppearancePbrAssets',
    status: 'manualRequired',
    reason: parsed.wantsPbr
      ? 'Goal asks for PBR/SurfaceAppearance. V93 will not fake albedo, normal, metalness, or roughness asset ids.'
      : 'Optional premium PBR upgrade requires real uploaded or existing texture asset ids.',
    fallback: 'Use built-in Roblox Materials plus Color3, Neon, Glass, and light fixtures until real PBR assets are supplied.',
    requiredInputs: ['ColorMap asset id', 'NormalMap asset id', 'RoughnessMap asset id', 'MetalnessMap asset id'],
  };
}

module.exports = {
  createSurfaceAppearanceSpec,
};
