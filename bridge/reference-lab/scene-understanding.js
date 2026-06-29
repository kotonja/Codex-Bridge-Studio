'use strict';

function understandScene(ctx) {
  const sceneType = ctx.isHub ? 'spawn hub / lobby' : (ctx.isCombat ? 'combat arena / ability showcase' : (ctx.isDungeon ? 'dungeon gate scene' : 'stylized Roblox scene'));
  return {
    sceneType,
    likelyScale: ctx.isHub ? 'large multi-zone player hub' : 'medium hero setpiece',
    foreground: ctx.isHub ? ['spawn pad', 'main path start', 'player orientation signage'] : ['hero prop or character-facing platform'],
    midground: ctx.isDungeon ? ['portal gate', 'stairs/bridge', 'flanking pillars'] : ['primary interactable', 'shop/upgrade stations', 'reward object'],
    background: ctx.isDungeon ? ['tall silhouettes', 'fog layers', 'secondary arches'] : ['skyline props', 'soft vistas', 'decorative depth objects'],
    focalPoints: ctx.isDungeon ? ['glowing gate/portal', 'central path', 'rune crest'] : ['main sign/objective', 'spawn landmark', 'interactive pads'],
    majorStructures: ctx.isDungeon ? ['portal arch', 'stone stairs', 'side pylons', 'trimmed platforms'] : ['spawn pad', 'shop kiosk', 'leaderboard/display', 'portal/doorway'],
    propGroups: ['trim pieces', 'small readable props', 'ambient VFX anchors', 'signage/icons'],
    walkableAreasHypothesis: ['main center path', 'clear loop around focal object', 'side pads for interactions'],
    blockedAreasHypothesis: ['behind focal gate', 'decor-only raised trim', 'outer vista ledges'],
    verticalityHypothesis: ctx.isDungeon ? 'medium-high: stairs, arches, upper silhouettes' : 'low-medium: platforms and readable tiering',
    interiorExteriorGuess: ctx.isDungeon && !ctx.q.includes('outdoor') ? 'ambiguous dungeon threshold' : 'exterior/open hub',
    gameplayUseCases: ctx.isCombat ? ['boss intro', 'ability test area', 'combat telegraph space'] : ['spawn orientation', 'portal travel', 'shops/upgrades', 'quest pickup'],
  };
}

module.exports = {
  understandScene,
};
