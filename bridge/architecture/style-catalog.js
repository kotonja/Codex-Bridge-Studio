'use strict';

const { color } = require('./schema');

function style(id, label, silhouetteLanguage, palette, extras = {}) {
  return {
    id,
    label,
    silhouetteLanguage,
    moduleGrid: extras.moduleGrid || { baseModule: 8, verticalModule: 6, bayWidth: 10, clearance: 5 },
    archRules: extras.archRules || ['use 5-9 readable block segments', 'keystone sits above player read line', 'inner frame is inset from outer frame'],
    wallRules: extras.wallRules || ['straight bay', 'corner bay', 'doorway bay', 'window bay', 'broken bay'],
    roofRules: extras.roofRules || ['strong ridge or cap silhouette', 'readable eaves', 'mobile low-detail fallback'],
    windowDoorRules: extras.windowDoorRules || ['repeat bay rhythm', 'use inset frames', 'blocked decorative alternatives are explicit'],
    pillarRules: extras.pillarRules || ['base, shaft, capital', 'corner pillars anchor wall rhythm', 'broken variant keeps collision clear'],
    trimRules: extras.trimRules || ['primary trim band', 'secondary bevel strip', 'accent seam markers'],
    depthRules: extras.depthRules || ['base silhouette', 'trim/depth layer', 'accent/socket layer'],
    forbiddenCheapPatterns: extras.forbiddenCheapPatterns || ['flat unbroken walls', 'random tiny cubes', 'unsupported floating parts without anchors'],
    mobileBudgetHints: extras.mobileBudgetHints || ['large modules first', 'prefer fewer strong silhouettes over micro detail', 'cap lights and transparent layers'],
    palette,
    materialHints: extras.materialHints || ['Slate', 'SmoothPlastic', 'Metal', 'Neon'],
  };
}

const STYLES = [
  style('animeDungeonArchitecture', 'Anime Dungeon Architecture', ['oversized portal silhouettes', 'tiered plinths', 'chunky readable ruins'], [color(0.1, 0.07, 0.16), color(0.5, 0.12, 1), color(0.9, 0.68, 0.22)]),
  style('darkPortalRuins', 'Dark Portal Ruins', ['broken arch rings', 'jagged asymmetric stone chunks', 'deep glowing core'], [color(0.04, 0.03, 0.06), color(0.22, 0.05, 0.45), color(0.78, 0.1, 1)]),
  style('hauntedMansion', 'Haunted Mansion', ['tall narrow windows', 'crooked roofline', 'thin iron silhouettes'], [color(0.05, 0.04, 0.06), color(0.2, 0.13, 0.1), color(0.55, 0.1, 0.82)]),
  style('fantasyCastle', 'Fantasy Castle', ['battlements', 'buttresses', 'arched keeps'], [color(0.28, 0.28, 0.26), color(0.66, 0.55, 0.3), color(0.1, 0.55, 0.9)]),
  style('sciFiFacility', 'Sci-Fi Facility', ['long panel bays', 'blast door frames', 'antenna silhouettes'], [color(0.08, 0.1, 0.14), color(0.28, 0.34, 0.4), color(0.05, 0.55, 1)]),
  style('elementalTemple', 'Elemental Temple', ['tiered shrines', 'pylon rhythm', 'symmetrical stairs'], [color(0.24, 0.2, 0.16), color(0.05, 0.75, 1), color(1, 0.35, 0.1)]),
  style('cyberpunkAlley', 'Cyberpunk Alley', ['stacked facade signs', 'bridge layers', 'cable rails'], [color(0.03, 0.03, 0.08), color(0.05, 0.8, 1), color(1, 0.08, 0.65)]),
  style('skyIslandShrine', 'Sky Island Shrine', ['floating platforms', 'thin spires', 'wind ribbon caps'], [color(0.32, 0.75, 1), color(0.9, 0.95, 1), color(0.95, 0.72, 0.24)]),
  style('underwaterCavernRuins', 'Underwater Cavern Ruins', ['cave ribs', 'coral arch modules', 'bubble columns'], [color(0.02, 0.18, 0.3), color(0.0, 0.65, 0.9), color(0.95, 0.36, 0.55)]),
  style('cuteSimulatorPlaza', 'Cute Simulator Plaza', ['chunky kiosk silhouettes', 'rounded sign frames', 'toy-like plazas'], [color(0.2, 0.7, 1), color(1, 0.45, 0.78), color(1, 0.85, 0.25)]),
  style('bossRaidGate', 'Boss Raid Gate', ['massive threshold', 'warning plinths', 'cinematic upper crown'], [color(0.1, 0.08, 0.12), color(0.7, 0.12, 0.16), color(1, 0.72, 0.25)]),
  style('trainingDojo', 'Training Dojo', ['wide roof sweep', 'wooden rhythm bays', 'clean courtyard modules'], [color(0.34, 0.18, 0.1), color(0.78, 0.6, 0.36), color(0.88, 0.12, 0.1)]),
];

function getStyleCatalog() {
  return STYLES.map((item) => ({ ...item, palette: item.palette.map((entry) => ({ ...entry })) }));
}

function inferStyleId(goal) {
  const q = String(goal || '').toLowerCase();
  if (/haunted|mansion|horror/.test(q)) return 'hauntedMansion';
  if (/castle|keep|fortress/.test(q)) return 'fantasyCastle';
  if (/sci[-\s]?fi|facility|tech|hangar/.test(q)) return 'sciFiFacility';
  if (/element|temple|fire|water|ice|earth/.test(q)) return 'elementalTemple';
  if (/cyber|alley|neon city/.test(q)) return 'cyberpunkAlley';
  if (/sky|island|shrine|cloud/.test(q)) return 'skyIslandShrine';
  if (/underwater|cavern|coral|ocean/.test(q)) return 'underwaterCavernRuins';
  if (/cute|simulator|plaza|shop|rebirth/.test(q)) return 'cuteSimulatorPlaza';
  if (/boss|raid/.test(q)) return 'bossRaidGate';
  if (/dojo|training/.test(q)) return 'trainingDojo';
  if (/dark|portal|ruin|purple/.test(q)) return 'darkPortalRuins';
  return 'animeDungeonArchitecture';
}

function getStyle(styleId) {
  return getStyleCatalog().find((item) => item.id === styleId) || getStyleCatalog()[0];
}

module.exports = { getStyle, getStyleCatalog, inferStyleId };
