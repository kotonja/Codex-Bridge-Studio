'use strict';

function createMissingViewReport(ctx) {
  return [
    {
      missingThing: 'back side / rear silhouette',
      whyItMatters: 'Determines whether the landmark works from return routes and camera orbit.',
      safeInference: 'Mirror the main trim language with simpler rear detail.',
      confidence: 0.55,
      needsUserReference: true,
      suggestedCommand: `tools\\bridge.cmd reference analyze "${ctx.clean} rear view"`,
    },
    {
      missingThing: 'interior or behind-gate function',
      whyItMatters: 'A portal/dungeon reference needs gameplay meaning after the player reaches it.',
      safeInference: 'Use an activation pad and transition VFX until a second reference clarifies destination.',
      confidence: 0.62,
      needsUserReference: ctx.isDungeon,
      suggestedCommand: `tools\\bridge.cmd worldgen graph "${ctx.clean}"`,
    },
    {
      missingThing: 'exact scale against Roblox avatar',
      whyItMatters: 'Premium scenes fail when doors, trims, and signs are not avatar-readable.',
      safeInference: 'Use 1 avatar = 5 studs, main doors 12-18 studs tall, signs readable from spawn.',
      confidence: 0.7,
      needsUserReference: false,
      suggestedCommand: `tools\\bridge.cmd visual critique "${ctx.clean}"`,
    },
    {
      missingThing: 'side routes and secondary interactions',
      whyItMatters: 'Hub references usually show a hero angle but not the retention loop.',
      safeInference: 'Add two side loops: shop/reward on one side and portal/quest on the other.',
      confidence: 0.64,
      needsUserReference: true,
      suggestedCommand: `tools\\bridge.cmd reference layout "${ctx.clean}"`,
    },
  ];
}

module.exports = {
  createMissingViewReport,
};
