'use strict';

const { VERSION } = require('./schema');

function style(id, theme, palette, materialLanguage, forbiddenCheapPatterns = []) {
  return {
    id,
    version: VERSION,
    label: theme,
    visualPillars: [`${theme} silhouette clarity`, 'premium focal read', 'repeatable modular detail'],
    shapeLanguage: ['large readable primary forms', 'medium trim bands', 'small controlled accent details'],
    silhouetteRules: ['one hero outline per family', 'avoid flat boxes without crowns or trims', 'keep mobile-readable negative space'],
    materialLanguage,
    colorPalette: palette,
    trimLanguage: ['gold/brass or theme-color rim trims', 'beveled caps', 'thin emissive accents'],
    bevelRules: ['fake bevels with layered parts when mesh is unavailable', 'wide bevel on hero assets', 'small bevel only on repeated trim'],
    decalLanguage: ['use decals for signage, runes, warnings, icons, and directional arrows', 'avoid noisy full-surface stickers'],
    vfxSocketLanguage: ['hero glow socket', 'ambient loop socket', 'impact/burst socket'],
    audioSocketLanguage: ['loop hum socket', 'interaction cue socket', 'reward cue socket'],
    animationSocketLanguage: ['idle loop marker', 'activate marker', 'impact marker'],
    collisionRules: ['simple invisible proxy blocks', 'no tiny collision detail', 'separate visual mesh from collision proxy'],
    mobileBudgetHints: ['LOD low-detail fallback', 'cap transparent layers', 'merge repeated trim families'],
    forbiddenCheapPatterns: ['unscaled free-model clutter', 'random neon spam', 'unlabeled texture IDs', ...forbiddenCheapPatterns],
  };
}

const STYLES = [
  style('premiumAnimeDungeon', 'Premium Anime Dungeon', ['obsidian', 'violet', 'cyan glow', 'warm gold'], ['Slate', 'Metal', 'Neon', 'Glass'], ['gray brick spam']),
  style('slimeBubbleSimulator', 'Slime Bubble Simulator', ['bubble blue', 'slime green', 'candy pink', 'white foam'], ['SmoothPlastic', 'Glass', 'Neon'], ['muddy green monotone']),
  style('sciFiHangar', 'Sci-Fi Hangar', ['gunmetal', 'hazard yellow', 'electric blue', 'white panels'], ['Metal', 'Glass', 'Neon', 'Concrete']),
  style('fantasyVillage', 'Fantasy Village', ['warm wood', 'moss green', 'cream stone', 'copper'], ['Wood', 'Slate', 'Grass', 'Fabric']),
  style('elementalArena', 'Elemental Arena', ['lava orange', 'ice blue', 'storm purple', 'stone gray'], ['Rock', 'Neon', 'Ice', 'Slate']),
  style('bossRaidTemple', 'Boss Raid Temple', ['ancient gold', 'dark stone', 'blood red', 'holy white'], ['Slate', 'Metal', 'Marble', 'Neon']),
  style('portalNexus', 'Portal Nexus', ['deep blue', 'arcane purple', 'silver', 'cyan'], ['Glass', 'Metal', 'Neon', 'Marble']),
  style('trainingDojo', 'Training Dojo', ['tatami tan', 'ink black', 'red cloth', 'warm lantern'], ['Wood', 'Fabric', 'Slate', 'Paper']),
  style('tycoonIsland', 'Tycoon Island', ['tropical green', 'ocean blue', 'factory gray', 'coin gold'], ['Grass', 'Metal', 'Concrete', 'Sand']),
  style('horrorFacility', 'Horror Facility', ['cold gray', 'sick green', 'warning amber', 'deep shadow'], ['Concrete', 'Metal', 'Neon'], ['overbright cheerful colors']),
  style('underwaterCavern', 'Underwater Cavern', ['teal', 'deep blue', 'pearl white', 'coral pink'], ['Glass', 'Rock', 'Sand', 'Neon']),
  style('skyIsland', 'Sky Island', ['cloud white', 'sky blue', 'leaf green', 'sun gold'], ['SmoothPlastic', 'Grass', 'Slate', 'Glass']),
  style('cyberpunkCity', 'Cyberpunk City', ['magenta', 'cyan', 'black glass', 'chrome'], ['Metal', 'Glass', 'Neon', 'Asphalt']),
  style('cutePetPlaza', 'Cute Pet Plaza', ['pastel pink', 'mint', 'cream', 'soft blue'], ['SmoothPlastic', 'Fabric', 'Glass']),
  style('pirateCove', 'Pirate Cove', ['weathered wood', 'rope tan', 'sea blue', 'treasure gold'], ['Wood', 'Sand', 'Metal', 'Water']),
  style('desertRuins', 'Desert Ruins', ['sandstone', 'turquoise', 'sun gold', 'shadow brown'], ['Sandstone', 'Slate', 'Metal']),
  style('iceCastle', 'Ice Castle', ['ice blue', 'white', 'silver', 'aurora purple'], ['Ice', 'Glass', 'Metal', 'Neon']),
  style('lavaForge', 'Lava Forge', ['basalt', 'molten orange', 'hot yellow', 'black iron'], ['Rock', 'Metal', 'Neon', 'Slate']),
];

function getStyleCatalog() {
  return STYLES.map((item) => ({ ...item }));
}

function getStyle(id = '') {
  const key = String(id || '').toLowerCase();
  return getStyleCatalog().find((item) => item.id.toLowerCase() === key) || getStyleCatalog()[0];
}

module.exports = { getStyle, getStyleCatalog };
