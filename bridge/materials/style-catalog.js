'use strict';

const { color } = require('./schema');

const STYLES = [
  style('darkAnimeDungeon', ['dark', 'anime', 'dungeon'], [color(0.08, 0.06, 0.12), color(0.14, 0.1, 0.2)], [color(0.55, 0.1, 1), color(0.1, 0.75, 1)], ['Slate', 'Basalt', 'Metal', 'Neon', 'Glass'], 'purple portal glow, cool rim lights, controlled neon seams'),
  style('purplePortalRuins', ['purple', 'portal', 'ruin', 'gate'], [color(0.09, 0.07, 0.12), color(0.18, 0.14, 0.2)], [color(0.7, 0.16, 1), color(0.25, 0.9, 1)], ['Slate', 'Basalt', 'Metal', 'Glass', 'Neon'], 'portal core as the hero light, dim ruins, cyan edge contrast'),
  style('hauntedMansion', ['haunted', 'mansion', 'horror'], [color(0.1, 0.08, 0.08), color(0.22, 0.18, 0.14)], [color(0.45, 0.05, 0.9), color(0.85, 0.55, 0.15)], ['Wood', 'Slate', 'Metal', 'Glass', 'Neon'], 'warm candle accents against cold purple fog'),
  style('fantasyCastle', ['castle', 'fantasy', 'royal'], [color(0.42, 0.39, 0.34), color(0.18, 0.19, 0.24)], [color(0.95, 0.74, 0.25), color(0.28, 0.55, 1)], ['Cobblestone', 'Marble', 'Metal', 'Glass', 'Neon'], 'gold trim, blue magical accents, broad stone massing'),
  style('sciFiFacility', ['sci', 'facility', 'lab'], [color(0.12, 0.14, 0.16), color(0.75, 0.78, 0.82)], [color(0.1, 0.95, 1), color(0.2, 0.45, 1)], ['Metal', 'SmoothPlastic', 'Glass', 'Neon', 'Concrete'], 'thin cyan strips, clean panels, low haze'),
  style('elementalTemple', ['elemental', 'temple', 'shrine'], [color(0.25, 0.22, 0.16), color(0.13, 0.18, 0.14)], [color(1, 0.4, 0.08), color(0.1, 0.85, 0.5)], ['Slate', 'Grass', 'Wood', 'Neon', 'Glass'], 'element colors isolated to sockets and altar cores'),
  style('cyberpunkNeon', ['cyber', 'neon', 'city'], [color(0.04, 0.04, 0.07), color(0.12, 0.12, 0.18)], [color(1, 0.05, 0.65), color(0, 0.85, 1)], ['Metal', 'Glass', 'SmoothPlastic', 'Neon', 'ForceField'], 'high contrast signage glow, strict neon budget'),
  style('skyIslandPastel', ['sky', 'island', 'pastel'], [color(0.82, 0.88, 0.92), color(0.52, 0.78, 0.95)], [color(1, 0.6, 0.86), color(0.42, 1, 0.68)], ['SmoothPlastic', 'Grass', 'Glass', 'Neon', 'Wood'], 'soft sky bounce, pastel portals, no muddy shadows'),
  style('underwaterGlow', ['underwater', 'coral', 'ocean'], [color(0.02, 0.16, 0.22), color(0.05, 0.28, 0.34)], [color(0.18, 1, 0.85), color(0.9, 0.2, 0.95)], ['Glass', 'Sand', 'Slate', 'Neon', 'ForceField'], 'caustic-like cyan glows, soft fog, bubble accents'),
  style('cuteSimulatorBright', ['cute', 'simulator', 'bright'], [color(0.92, 0.94, 0.98), color(0.72, 0.9, 1)], [color(1, 0.45, 0.75), color(0.45, 0.95, 0.35)], ['SmoothPlastic', 'Glass', 'Neon', 'Grass', 'Wood'], 'bright toy-like material contrast with low harshness'),
  style('bossRaidLava', ['boss', 'raid', 'lava'], [color(0.08, 0.05, 0.04), color(0.24, 0.08, 0.04)], [color(1, 0.2, 0.04), color(1, 0.75, 0.1)], ['Basalt', 'Slate', 'Metal', 'Neon', 'Glass'], 'hot underlight, lava cores, smoky warm rim'),
  style('trainingDojoWarm', ['training', 'dojo', 'warm'], [color(0.34, 0.2, 0.12), color(0.52, 0.34, 0.18)], [color(0.95, 0.62, 0.25), color(0.8, 0.12, 0.12)], ['Wood', 'WoodPlanks', 'Fabric', 'Metal', 'SmoothPlastic'], 'warm lantern rhythm, restrained red accents, soft shadows'),
];

function style(id, keywords, basePalette, accentPalette, materialPalette, lightingLanguage) {
  return {
    id,
    keywords,
    basePalette,
    accentPalette,
    materialPalette,
    glowRules: ['one hero glow source', 'small rim accents only', 'avoid neon on large base masses'],
    trimContrastRules: ['trim material must differ from base material', 'trim color should be 25-45 percent brighter than base', 'repeat trim rhythm around focal forms'],
    lightingLanguage,
    atmosphereLanguage: ['fog supports depth but does not hide gameplay routes', 'ambient is a mood note unless explicitly approved for global Lighting'],
    forbiddenCheapPatterns: ['single flat SmoothPlastic color everywhere', 'random neon everywhere', 'unbudgeted point lights', 'fake texture ids', 'PBR claims without asset ids'],
    mobileBudgetHints: ['target <= 8 local lights for a small scene', 'prefer material/color contrast before adding more lights', 'make glows readable at low graphics settings'],
  };
}

function getStyleCatalog() {
  return STYLES.map((item) => ({ ...item }));
}

function getStyle(styleId) {
  return STYLES.find((item) => item.id === styleId) || STYLES[0];
}

function inferStyle(goal) {
  const q = String(goal || '').toLowerCase();
  const found = STYLES.find((item) => item.keywords.some((keyword) => q.includes(keyword)));
  if (found) return found.id;
  if (/purple|portal|gate|dungeon|anime/.test(q)) return 'purplePortalRuins';
  if (/bright|cute|simulator/.test(q)) return 'cuteSimulatorBright';
  return 'darkAnimeDungeon';
}

module.exports = {
  getStyle,
  getStyleCatalog,
  inferStyle,
};
