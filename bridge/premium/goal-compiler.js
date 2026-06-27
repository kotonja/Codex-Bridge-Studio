'use strict';

const { safeGoal, slugify, nowIso } = require('./schema');

function includesAny(text, words) {
  return words.some((word) => text.includes(word));
}

function inferGenre(text) {
  if (includesAny(text, ['anime', 'boss', 'combat', 'arena', 'sword', 'ability'])) return 'anime action / combat';
  if (includesAny(text, ['simulator', 'pet', 'rebirth', 'upgrade', 'currency'])) return 'premium simulator';
  if (includesAny(text, ['obby', 'escape', 'parkour'])) return 'premium obby / escape';
  if (includesAny(text, ['horror', 'scary', 'dark'])) return 'cinematic horror';
  if (includesAny(text, ['roleplay', 'city', 'house'])) return 'social roleplay';
  if (includesAny(text, ['lobby', 'hub', 'portal'])) return 'premium hub';
  return 'universal Roblox experience';
}

function inferAudience(text) {
  if (includesAny(text, ['anime', 'combat', 'boss'])) return 'players who want flashy readable power fantasy and strong combat feedback';
  if (includesAny(text, ['simulator', 'pet', 'rebirth'])) return 'simulator players who like clear progression, rewards, and spectacle';
  if (includesAny(text, ['obby', 'escape'])) return 'players who need instant path readability and satisfying checkpoints';
  return 'broad Roblox players who expect fast readability, premium feedback, and mobile-safe performance';
}

function inferStyle(text) {
  if (includesAny(text, ['slime', 'bubble'])) return 'glossy playful candy-lab';
  if (includesAny(text, ['anime', 'lightning', 'purple', 'boss'])) return 'cinematic anime energy';
  if (includesAny(text, ['sci-fi', 'tech', 'neon'])) return 'clean neon sci-fi';
  if (includesAny(text, ['horror', 'dark'])) return 'moody cinematic tension';
  if (includesAny(text, ['royal', 'gold', 'premium'])) return 'polished luxury arcade';
  return 'clean premium Roblox';
}

function inferScale(text) {
  if (includesAny(text, ['world', 'city', 'huge', 'massive', 'whole game'])) return 'large';
  if (includesAny(text, ['hub', 'lobby', 'arena', 'map'])) return 'scene';
  return 'focused slice';
}

function compileGoal(goal, options = {}) {
  const cleanGoal = safeGoal(goal || options.goal || options.intent);
  const text = cleanGoal.toLowerCase();
  const tags = [];
  for (const [tag, words] of Object.entries({
    premium: ['premium', 'top dev', 'expensive', 'aaa', 'beautiful'],
    vfx: ['vfx', 'effect', 'aura', 'beam', 'projectile', 'slash', 'burst'],
    animation: ['animation', 'animate', 'motion', 'pose', 'keyframe'],
    gameplay: ['quest', 'shop', 'portal', 'boss', 'ability', 'round', 'test'],
    mobile: ['mobile', 'phone', 'tablet'],
    ui: ['ui', 'hud', 'menu', 'button', 'sign'],
  })) {
    if (includesAny(text, words)) tags.push(tag);
  }
  return {
    goal: cleanGoal,
    id: slugify(cleanGoal, 'premium_goal'),
    compiledAt: nowIso(),
    targetGenre: inferGenre(text),
    targetAudience: inferAudience(text),
    style: inferStyle(text),
    scale: inferScale(text),
    tags,
    intentSignals: {
      wantsPremium: tags.includes('premium') || includesAny(text, ['beautiful', 'top dev', 'expensive']),
      needsVfx: tags.includes('vfx'),
      needsAnimation: tags.includes('animation'),
      needsUi: tags.includes('ui'),
      needsGameplay: tags.includes('gameplay'),
      mobileCritical: tags.includes('mobile') || true,
    },
    evidence: ['goal text', 'keyword intent classifier', 'V63 deterministic compiler'],
  };
}

module.exports = { compileGoal };
