'use strict';

function createModuleGrid(parsed, style) {
  const grid = style.moduleGrid || {};
  const scale = parsed.power === 'large' ? 1.25 : parsed.power === 'small' ? 0.75 : 1;
  return {
    baseModule: Math.round((grid.baseModule || 8) * scale),
    verticalModule: Math.round((grid.verticalModule || 6) * scale),
    bayWidth: Math.round((grid.bayWidth || 10) * scale),
    wallThickness: Math.max(1, Math.round(2 * scale)),
    clearance: Math.max(5, Math.round((grid.clearance || 5) * scale)),
    snap: 0.5,
    notes: ['modules align to readable Roblox studs', 'collision proxies stay simple', 'decorative layers do not block routes'],
  };
}

module.exports = { createModuleGrid };
