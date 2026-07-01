'use strict';

const { color, nowIso, safeGoal } = require('./schema');

function createLightingPlan(goal, palette, parsed, options = {}) {
  const accent = (palette.accentColors && palette.accentColors[0]) || color(0.55, 0.1, 1);
  const rim = (palette.accentColors && palette.accentColors[1]) || color(0.1, 0.75, 1);
  return {
    ok: true,
    version: options.version,
    at: nowIso(),
    goal: safeGoal(goal),
    styleId: parsed.styleId,
    keyLight: { role: 'soft scene readability', brightness: 0.8, range: 22, color: color(0.78, 0.72, 0.86), manualGlobalApply: true },
    rimLight: { role: 'separate silhouettes from dark background', brightness: 1.2, range: 18, color: rim },
    accentLights: [
      { role: 'portal core glow', brightness: 1.7, range: 18, color: accent },
      { role: 'path guide lights', brightness: 0.55, range: 10, color: rim },
    ],
    portalCoreGlow: { material: 'Neon', color: accent, maxPointLights: 2 },
    pathGuideLights: { spacingStuds: 18, maxVisible: 4, color: rim },
    mobileReduction: ['disable shadows on secondary accents first', 'collapse guide lights into neon marker parts on low graphics', 'cap total real light instances at 8'],
    brightnessLimits: { pointLightMax: 1.8, spotLightMax: 1.4, surfaceLightMax: 1.2 },
    rangeLimits: { pointLightMax: 22, spotLightMax: 28, surfaceLightMax: 18 },
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd materials fixtures "${safeGoal(goal)}"`,
  };
}

module.exports = {
  createLightingPlan,
};
