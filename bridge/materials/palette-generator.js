'use strict';

const { color, nowIso, safeGoal } = require('./schema');
const { getStyle } = require('./style-catalog');
const { materialForRole, validateMaterialPalette } = require('./roblox-material-map');
const { createSurfaceAppearanceSpec } = require('./surfaceappearance-spec');

const ROLE_ORDER = ['baseStone', 'trim', 'metal', 'glass', 'emissive', 'path', 'crystal', 'wood', 'cloth', 'water', 'fog'];

function createMaterialPalette(goal, parsed, options = {}) {
  const style = getStyle(parsed.styleId);
  const materials = ROLE_ORDER.map((role, index) => ({
    role,
    robloxMaterial: materialForRole(role),
    color: role === 'emissive' ? style.accentPalette[0]
      : role === 'crystal' || role === 'glass' ? style.accentPalette[1] || style.accentPalette[0]
        : role === 'trim' || role === 'metal' ? color(0.72, 0.58, 0.28)
          : style.basePalette[index % style.basePalette.length],
    fallback: materialForRole(role),
    notes: role === 'emissive'
      ? ['Use sparingly for readable focal glow; never flood the whole build with Neon.']
      : ['Built-in Roblox material, no texture id required.'],
  }));
  const manualRequired = [createSurfaceAppearanceSpec(goal, parsed)].filter(Boolean);
  if (parsed.wantsGlobalLighting) {
    manualRequired.push({
      action: 'globalLightingPropertyApply',
      status: 'manualRequired',
      reason: 'V93 creates lighting profile manifests by default; global Lighting property mutation needs explicit user approval.',
    });
  }
  return {
    ok: true,
    version: options.version,
    at: nowIso(),
    goal: safeGoal(goal),
    styleId: style.id,
    baseColors: style.basePalette,
    accentColors: style.accentPalette,
    emissiveColors: [style.accentPalette[0], style.accentPalette[1] || style.accentPalette[0]],
    neutralColors: [color(0.08, 0.08, 0.1), color(0.72, 0.7, 0.66), color(0.18, 0.16, 0.2)],
    materials: validateMaterialPalette(materials),
    manualRequired,
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd materials swatches "${safeGoal(goal)}"`,
  };
}

module.exports = {
  ROLE_ORDER,
  createMaterialPalette,
};
