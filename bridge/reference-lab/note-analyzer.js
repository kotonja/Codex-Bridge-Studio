'use strict';

const { safeText } = require('./schema');

function tokens(text = '') {
  return safeText(text).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

function includesAny(q, words) {
  return words.some((word) => q.includes(word));
}

function analyzeNote(goal = '') {
  const clean = safeText(goal, 'Roblox reference');
  const q = clean.toLowerCase();
  const tags = tokens(clean);
  const isAnime = includesAny(q, ['anime', 'manga', 'shonen', 'boss', 'katana']);
  const isDungeon = includesAny(q, ['dungeon', 'gate', 'portal', 'castle', 'ruin', 'temple']);
  const isCute = includesAny(q, ['slime', 'bubble', 'cute', 'pet', 'toy', 'candy']);
  const isSciFi = includesAny(q, ['sci', 'cyber', 'neon', 'tech', 'lab', 'robot']);
  const isDark = includesAny(q, ['dark', 'purple', 'void', 'shadow', 'horror', 'night']);
  const isCombat = includesAny(q, ['combat', 'boss', 'attack', 'arena', 'weapon', 'slash', 'beam']);
  const isHub = includesAny(q, ['hub', 'lobby', 'spawn', 'shop', 'portal']);
  return {
    clean,
    q,
    tags,
    isAnime,
    isDungeon,
    isCute,
    isSciFi,
    isDark,
    isCombat,
    isHub,
    complexity: tags.length > 5 || isDungeon || isHub || isCombat ? 'complex' : 'simple',
    colorSignals: [
      q.includes('purple') ? 'dark purple' : null,
      q.includes('gold') ? 'gold trim' : null,
      q.includes('blue') ? 'blue glow' : null,
      q.includes('red') ? 'red danger accents' : null,
      q.includes('green') ? 'green magic/accent' : null,
    ].filter(Boolean),
  };
}

module.exports = {
  analyzeNote,
};
