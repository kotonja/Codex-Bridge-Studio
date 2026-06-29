'use strict';

function interpretGameplay(ctx) {
  return {
    possiblePlayerSpawn: ctx.isHub ? 'foreground/outer ring facing the main landmark' : 'safe staging area with immediate view of focal object',
    likelyObjective: ctx.isDungeon ? 'approach/activate portal gate or enter dungeon route' : (ctx.isCombat ? 'trigger combat/ability sequence' : 'orient player toward primary interaction'),
    interactionPoints: ctx.isDungeon ? ['portal activation', 'quest NPC/sign', 'reward chest/shop pad'] : ['shop button/pad', 'portal pad', 'leaderboard/reward station'],
    traversalRoute: ['spawn', 'main readable path', 'focal landmark', 'side loop return'],
    socialPossibilities: ['spawn congregation zone', 'screenshot/photo spot', 'leaderboard or flex display'],
    combatPossibilities: ctx.isCombat || ctx.isDungeon ? ['boss gate intro', 'telegraphed arena entry', 'ability/VFX showcase'] : [],
    shopPossibilities: ctx.isHub ? ['upgrade shop', 'cosmetic display', 'portal unlock'] : ['pre-entry shop or reward stand'],
    questPossibilities: ['first objective board', 'portal unlock task', 'daily/reward loop'],
    portalPossibilities: ctx.isDungeon ? ['main dungeon entry', 'side challenge portal', 'return-to-hub exit'] : ['world travel portal'],
    rewardLoopIdeas: ['approach focal landmark', 'activate interaction', 'receive visual/audio feedback', 'unlock next destination or reward'],
    cinematicMoments: ctx.isDungeon ? ['portal hum buildup', 'gate opening flash', 'camera push through arch'] : ['spawn reveal', 'reward burst', 'shop unlock flourish'],
    qaRisks: ['spawn view may not explain objective', 'side interactables may compete visually', 'mobile labels may be too small', 'particle/glow overdraw may hide paths'],
  };
}

module.exports = {
  interpretGameplay,
};
