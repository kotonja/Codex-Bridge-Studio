'use strict';

const { color } = require('./schema');

const STYLES = [
  {
    id: 'animeDungeon',
    label: 'Anime Dungeon',
    shapeLanguage: ['oversized arch silhouette', 'stepped plinths', 'crystal anchors', 'wide readable paths'],
    trimLanguage: ['gold edge bands', 'black stone inset lines', 'glowing rune seams'],
    materialHints: ['Slate', 'Neon', 'Glass', 'Metal'],
    palette: [color(0.12, 0.08, 0.18), color(0.38, 0.12, 0.9), color(0.95, 0.72, 0.22), color(0.1, 0.85, 1)],
    lighting: ['purple portal core', 'cyan rim lights', 'warm trim glints'],
    propHints: ['floating crystals', 'quest board', 'reward chest', 'boss preview dais'],
    sockets: ['PortalCore', 'CrystalVfx', 'BossCamera', 'ShopPrompt', 'QuestPrompt'],
    forbidden: ['tiny unreadable clutter', 'single flat wall slabs'],
    mobileHints: ['large silhouettes first', 'limit particles to sockets'],
  },
  {
    id: 'darkPortal',
    label: 'Dark Portal',
    shapeLanguage: ['broken arch', 'jagged stones', 'deep inner ring', 'asymmetric ruin chunks'],
    trimLanguage: ['cracked stone ribs', 'purple seam cuts', 'charred edge caps'],
    materialHints: ['Basalt', 'Slate', 'Neon', 'ForceField'],
    palette: [color(0.04, 0.03, 0.06), color(0.22, 0.05, 0.45), color(0.78, 0.1, 1), color(0.12, 0.9, 1)],
    lighting: ['backlit portal', 'underlighting', 'misty floor glow'],
    propHints: ['broken pillars', 'skull-free boss markers', 'mist vents', 'rune shards'],
    sockets: ['PortalImpact', 'MistLoop', 'BossRevealCamera'],
    forbidden: ['flat neon rectangle portal', 'unlabeled danger zones'],
    mobileHints: ['keep jagged stones large enough to read'],
  },
  {
    id: 'slimeBubble',
    label: 'Slime Bubble',
    shapeLanguage: ['rounded tubes', 'soft cylinders', 'bubble domes', 'goo drips'],
    trimLanguage: ['plastic rim rings', 'gel seams', 'round rivets'],
    materialHints: ['SmoothPlastic', 'Glass', 'Neon'],
    palette: [color(0.45, 1, 0.2), color(0.05, 0.7, 1), color(1, 0.35, 0.76), color(1, 0.82, 0.25)],
    lighting: ['soft cyan glow', 'pink bounce lights', 'green goo highlights'],
    propHints: ['bubble balloons', 'goo pipes', 'pet door', 'rebirth pod'],
    sockets: ['BubbleVfx', 'GooLoop', 'PetPrompt'],
    forbidden: ['sharp horror silhouettes', 'muddy brown palette'],
    mobileHints: ['large round blobs, few transparent layers'],
  },
  {
    id: 'fantasyRuins',
    label: 'Fantasy Ruins',
    shapeLanguage: ['weathered arches', 'collapsed slabs', 'root-wrapped columns'],
    trimLanguage: ['stone relief bands', 'moss seams', 'engraved plaques'],
    materialHints: ['Slate', 'Grass', 'Wood', 'Metal'],
    palette: [color(0.32, 0.32, 0.28), color(0.2, 0.45, 0.22), color(0.7, 0.55, 0.28), color(0.32, 0.8, 0.64)],
    lighting: ['warm lanterns', 'green magic wells'],
    propHints: ['lantern posts', 'broken tablets', 'root planters'],
    sockets: ['RuneGlow', 'LanternAudio', 'QuestPrompt'],
    forbidden: ['perfectly clean repeated slabs'],
    mobileHints: ['contrast ruins against path'],
  },
  {
    id: 'sciFiHangar',
    label: 'Sci-Fi Hangar',
    shapeLanguage: ['long bays', 'panel grids', 'thick blast doors'],
    trimLanguage: ['warning stripes', 'blue edge lights', 'vent ribs'],
    materialHints: ['Metal', 'Neon', 'Glass'],
    palette: [color(0.08, 0.1, 0.14), color(0.28, 0.34, 0.4), color(0.05, 0.55, 1), color(1, 0.65, 0.08)],
    lighting: ['blue strip lights', 'landing pad beacons'],
    propHints: ['cargo crates', 'control consoles', 'antenna towers'],
    sockets: ['DoorVfx', 'AlarmAudio', 'ShipCamera'],
    forbidden: ['ornate fantasy gold'],
    mobileHints: ['avoid excessive panel micro-lines'],
  },
  {
    id: 'bossArena',
    label: 'Boss Arena',
    shapeLanguage: ['circular dais', 'radial lanes', 'boss throne silhouette'],
    trimLanguage: ['arena rings', 'damage lane marks', 'warning rims'],
    materialHints: ['Slate', 'Metal', 'Neon'],
    palette: [color(0.1, 0.08, 0.12), color(0.7, 0.12, 0.16), color(1, 0.72, 0.25), color(0.75, 0.1, 1)],
    lighting: ['center spotlight', 'impact rim lights'],
    propHints: ['boss platform', 'spectator stones', 'loot chest'],
    sockets: ['BossSpawn', 'DamageWindow', 'CinematicCamera'],
    forbidden: ['hidden spawn exits'],
    mobileHints: ['wide lanes and strong contrast'],
  },
  {
    id: 'cuteSimulator',
    label: 'Cute Simulator',
    shapeLanguage: ['chunky toy forms', 'rounded kiosks', 'iconic signs'],
    trimLanguage: ['bold outlines', 'button panels', 'soft gold rims'],
    materialHints: ['SmoothPlastic', 'Neon', 'Glass'],
    palette: [color(0.2, 0.7, 1), color(1, 0.45, 0.78), color(0.45, 1, 0.32), color(1, 0.85, 0.25)],
    lighting: ['soft shop glows', 'reward sparkles'],
    propHints: ['shop stand', 'upgrade pad', 'leaderboard frame'],
    sockets: ['RewardVfx', 'UiPrompt', 'ShopAudio'],
    forbidden: ['dark low-readability corners'],
    mobileHints: ['big labels and simple icons'],
  },
  {
    id: 'horrorMansion',
    label: 'Horror Mansion',
    shapeLanguage: ['tall windows', 'crooked rooflines', 'tight archways'],
    trimLanguage: ['thin moldings', 'aged wood strips', 'iron rails'],
    materialHints: ['Wood', 'Slate', 'Metal', 'Glass'],
    palette: [color(0.05, 0.04, 0.06), color(0.2, 0.13, 0.1), color(0.44, 0.08, 0.75), color(0.72, 0.62, 0.42)],
    lighting: ['low amber lamps', 'purple moon glow'],
    propHints: ['candles', 'portrait frames', 'dust vents'],
    sockets: ['CreakAudio', 'WindowLight', 'JumpCamera'],
    forbidden: ['full black unplayable space'],
    mobileHints: ['readable exits despite mood'],
  },
  {
    id: 'elementalTemple',
    label: 'Elemental Temple',
    shapeLanguage: ['tiered shrines', 'element pylons', 'symmetrical stairs'],
    trimLanguage: ['element bands', 'rune tiles', 'circular seals'],
    materialHints: ['Slate', 'Neon', 'Water', 'Ice'],
    palette: [color(0.24, 0.2, 0.16), color(0.05, 0.75, 1), color(1, 0.35, 0.1), color(0.45, 1, 0.38)],
    lighting: ['four-color pylons', 'center aura'],
    propHints: ['element altars', 'trial doors', 'reward chest'],
    sockets: ['ElementVfx', 'TrialPrompt', 'TempleCamera'],
    forbidden: ['random mixed color without hierarchy'],
    mobileHints: ['one dominant element per zone'],
  },
  {
    id: 'cyberpunkStreet',
    label: 'Cyberpunk Street',
    shapeLanguage: ['stacked signs', 'narrow alleys', 'overhead bridges'],
    trimLanguage: ['neon strips', 'billboard frames', 'cable rails'],
    materialHints: ['Metal', 'Glass', 'Neon', 'Asphalt'],
    palette: [color(0.03, 0.03, 0.08), color(0.05, 0.8, 1), color(1, 0.08, 0.65), color(1, 0.75, 0.12)],
    lighting: ['sign glow', 'rain reflections'],
    propHints: ['vendor kiosks', 'holo signs', 'wire bundles'],
    sockets: ['SignFlicker', 'AmbienceAudio', 'AlleyPrompt'],
    forbidden: ['flat gray boxes'],
    mobileHints: ['cap sign count per vista'],
  },
  {
    id: 'skyIsland',
    label: 'Sky Island',
    shapeLanguage: ['floating platforms', 'cloud bridges', 'thin spires'],
    trimLanguage: ['gold rails', 'cloud rims', 'wind ribbons'],
    materialHints: ['Grass', 'Slate', 'Neon', 'Glass'],
    palette: [color(0.32, 0.75, 1), color(0.9, 0.95, 1), color(0.95, 0.72, 0.24), color(0.45, 1, 0.85)],
    lighting: ['bright rim light', 'wind glows'],
    propHints: ['floating crystals', 'balloons', 'cloud rings'],
    sockets: ['WindVfx', 'CloudAudio', 'VistaCamera'],
    forbidden: ['invisible fall danger'],
    mobileHints: ['clear rail edges'],
  },
  {
    id: 'underwaterCavern',
    label: 'Underwater Cavern',
    shapeLanguage: ['cave ribs', 'coral arches', 'bubble columns'],
    trimLanguage: ['shell bands', 'kelp seams', 'glowing coral nodes'],
    materialHints: ['Slate', 'Glass', 'Neon', 'Sand'],
    palette: [color(0.02, 0.18, 0.3), color(0.0, 0.65, 0.9), color(0.95, 0.36, 0.55), color(0.35, 1, 0.62)],
    lighting: ['caustic cyan glow', 'coral accent lights'],
    propHints: ['bubble vents', 'coral clusters', 'treasure chest'],
    sockets: ['BubbleVfx', 'WaterAudio', 'ChestPrompt'],
    forbidden: ['opaque blue fog everywhere'],
    mobileHints: ['large coral silhouettes'],
  },
];

function getStyleCatalog() {
  return STYLES.map((style) => ({ ...style, palette: style.palette.map((entry) => ({ ...entry })) }));
}

function getStyle(styleId) {
  return getStyleCatalog().find((style) => style.id === styleId) || getStyleCatalog()[0];
}

function inferStyleId(goal) {
  const q = String(goal || '').toLowerCase();
  if (/slime|bubble|goo|pet|rebirth/.test(q)) return 'slimeBubble';
  if (/dark|portal|void|purple/.test(q)) return 'darkPortal';
  if (/ruin|fantasy|village|moss|root/.test(q)) return 'fantasyRuins';
  if (/sci[-\s]?fi|hangar|space|ship|tech/.test(q)) return 'sciFiHangar';
  if (/boss|arena|raid/.test(q)) return 'bossArena';
  if (/cute|simulator|shop|upgrade|leaderboard/.test(q)) return 'cuteSimulator';
  if (/horror|mansion|haunted/.test(q)) return 'horrorMansion';
  if (/element|temple|fire|water|ice|earth/.test(q)) return 'elementalTemple';
  if (/cyber|street|neon city/.test(q)) return 'cyberpunkStreet';
  if (/sky|island|cloud|floating/.test(q)) return 'skyIsland';
  if (/underwater|cavern|coral|ocean/.test(q)) return 'underwaterCavern';
  return 'animeDungeon';
}

module.exports = {
  getStyle,
  getStyleCatalog,
  inferStyleId,
};
