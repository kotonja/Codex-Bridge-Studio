'use strict';

function extractStyleProfile(ctx) {
  const palette = ctx.colorSignals.length ? ctx.colorSignals : (ctx.isDark ? ['violet', 'indigo', 'black stone', 'cool white glow'] : ['clean white', 'soft blue', 'gold trim', 'accent color']);
  return {
    genreGuess: ctx.isAnime ? 'premium anime fantasy Roblox' : (ctx.isSciFi ? 'premium sci-fi Roblox' : (ctx.isCute ? 'bright toy-like simulator Roblox' : 'premium stylized Roblox')),
    mood: ctx.isDark ? ['mysterious', 'high contrast', 'cinematic'] : (ctx.isCute ? ['playful', 'bright', 'satisfying'] : ['adventurous', 'clean', 'readable']),
    colorPalette: palette,
    materialPalette: ctx.isDungeon ? ['dark stone', 'polished gold trim', 'emissive portal glass', 'misty transparent VFX'] : ['painted plastic', 'soft metal trim', 'glass glow', 'clean decals'],
    shapeLanguage: ctx.isAnime ? ['bold silhouettes', 'oversized hero forms', 'sharp accent fins', 'readable circular portal geometry'] : ['chunky rounded primitives', 'clear bevels', 'modular trims'],
    silhouetteRules: ['one dominant focal landmark', 'large-medium-small detail rhythm', 'avoid evenly noisy surfaces', 'read from mobile distance'],
    trimLanguage: ctx.isDark ? ['thin gold bevels', 'rune strips', 'emissive edge lines'] : ['bright color bands', 'rounded trim rails', 'icon medallions'],
    lightingLanguage: ctx.isDark ? ['rim-lit focal portal', 'soft fog depth', 'glow contrast around interactables'] : ['high-key daylight', 'soft colored bounce', 'clear sign lighting'],
    VFXLanguage: ctx.isCombat ? ['charge aura', 'impact sparks', 'portal particles', 'thin streak trails'] : ['ambient motes', 'soft glow loops', 'reward sparkles'],
    UILanguage: ['large readable labels', 'icon plus text for interactables', 'consistent color coding', 'mobile-safe tap targets'],
    cameraLanguage: ctx.isHub ? ['wide spawn reveal', 'hero landmark centered', 'side shops visible in periphery'] : ['three-quarter hero angle', 'foreground framing', 'clear path line'],
    forbiddenCheapPatterns: ['flat default gray parts', 'random free-model clutter', 'tiny unreadable labels', 'same-size props everywhere', 'unbudgeted particle spam'],
    robloxTranslationNotes: ['build a style bible first', 'use AssetForge for reusable trims/props', 'use Worldgen for flow graph before parts', 'use Visual Critic after blockout'],
  };
}

module.exports = {
  extractStyleProfile,
};
