'use strict';

const { color, nowIso, safeGoal } = require('./schema');

function createAtmospherePlan(goal, palette, parsed, options = {}) {
  const fogColor = (palette.accentColors && palette.accentColors[0]) || color(0.45, 0.12, 0.85);
  return {
    ok: true,
    version: options.version,
    at: nowIso(),
    goal: safeGoal(goal),
    styleId: parsed.styleId,
    readOnlyByDefault: true,
    fogColor,
    ambientIntent: 'cool low ambient with readable route edges and stronger focal portal glow',
    outdoorIndoorMood: /interior|inside|room/.test(String(goal).toLowerCase()) ? 'indoor contained haze' : 'outdoor/large-space depth haze',
    atmosphereDensityIntent: { target: 0.28, mobileFallback: 0.12, note: 'manifest only unless global Lighting apply is explicitly approved' },
    colorCorrectionIntent: { saturation: 0.08, contrast: 0.12, tint: fogColor, manualRequired: true },
    bloomIntent: { intensity: 0.25, size: 28, threshold: 1.4, manualRequired: true },
    manualRequired: [
      {
        action: 'globalLightingAtmosphereApply',
        status: 'manualRequired',
        reason: 'V93 does not mutate global Lighting by default. This profile is safe manifest guidance unless explicitly approved.',
      },
    ],
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd materials manifest "${safeGoal(goal)}"`,
  };
}

module.exports = {
  createAtmospherePlan,
};
