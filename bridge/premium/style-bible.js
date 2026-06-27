'use strict';

const { VERSION, nowIso } = require('./schema');

function createStyleBible(brief) {
  const style = brief.style || 'clean premium Roblox';
  const isSlime = style.includes('slime') || brief.goal.toLowerCase().includes('slime');
  const isAnime = style.includes('anime') || brief.goal.toLowerCase().includes('anime');
  const palette = isSlime
    ? ['lime slime green', 'sky cyan glass', 'bubble pink', 'warm gold trim', 'soft white marble']
    : isAnime
      ? ['deep violet', 'electric cyan', 'hot magenta', 'black metal', 'white energy core']
      : ['hero blue', 'warm gold', 'soft white', 'charcoal contrast', 'accent neon'];
  return {
    version: VERSION,
    at: nowIso(),
    targetGenre: brief.targetGenre,
    targetAudience: brief.targetAudience,
    referenceQualityAdjectives: ['clean', 'layered', 'readable', 'intentional', 'screenshot-ready', 'premium'],
    colorPalette: palette,
    materialPalette: ['SmoothPlastic for broad forms', 'Metal for trims/rails', 'Neon only for focal energy', 'Glass/ForceField for tubes and cores', 'Texture/decal accents for signage'],
    shapeLanguage: isSlime
      ? ['rounded lab arches', 'bubble circles', 'dripping slime caps', 'chunky readable portals', 'soft bevel illusion trims']
      : ['large heroic silhouettes', 'clear primary/secondary/accent forms', 'thick trim strips', 'socketed VFX anchor points'],
    silhouetteRules: ['one hero focal per view', 'secondary landmarks lower than the hero', 'wide base/narrow accent rhythm', 'avoid flat boxes without trim'],
    lightingRules: ['warm key on focal object', 'cool rim light for depth', 'small neon accents only at interaction points', 'mobile-safe brightness contrast'],
    vfxRules: ['ambient motes around hero focal', 'looping low-rate particles', 'burst only on interaction', 'no screen-filling overdraw by default'],
    animationRules: ['anticipation before power', 'hold impact for readability', 'recovery must return attention to objective'],
    audioRules: ['soft ambience bed', 'short UI confirms', 'impact layer at marker moments', 'mobile-safe loudness bands'],
    uiRules: ['large literal labels at portals', 'one strong action per surface', 'safe-area aware HUD', 'high contrast text plaques'],
    cameraRules: ['spawn view sees objective and 2-3 secondary choices', 'avoid occluding labels', 'set camera beats for hero reveal and shop/portal choices'],
    forbiddenCheapLookingPatterns: ['default gray blocks', 'random neon everywhere', 'thin unreadable signs', 'unanchored clutter', 'no focal hierarchy', 'copy-pasted models without scale discipline'],
    mobileBudgetNotes: ['cap high-rate emitters', 'prefer 20-40 meaningful parts per generated prop cluster', 'one main glass/transparent focal per view', 'avoid dense text walls'],
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd premium assets "${brief.goal}"`,
  };
}

module.exports = { createStyleBible };
