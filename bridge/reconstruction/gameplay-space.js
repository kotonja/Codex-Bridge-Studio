'use strict';

function createGameplaySpacePlan(ctx) {
  const q = ctx.goal.toLowerCase();
  const isPortal = /portal|gate|rift/.test(q);
  return {
    spawnLocation: {
      id: 'spawn_front_plaza',
      roomId: 'entry_foyer',
      reason: 'Player should face the most readable entrance and understand the first destination instantly.',
      confidence: 0.74,
    },
    firstObjective: {
      id: isPortal ? 'activate_portal' : 'reach_primary_hall',
      roomId: 'primary_hall',
      label: isPortal ? 'Activate Portal' : 'Reach Main Hall',
      confidence: isPortal ? 0.72 : 0.62,
    },
    primaryLoop: 'spawn -> enter -> read objective -> interact with quest/shop/portal -> return to reward alcove',
    rewardLoop: 'portal/combat completion returns player attention to reward_room and then back to primary_hall.',
    spaces: [
      { id: 'shop_space', role: 'shop', roomId: 'side_shop', purpose: 'Optional upgrades/cosmetics without blocking main route.', confidence: 0.55 },
      { id: 'quest_space', role: 'quest', roomId: 'quest_room', purpose: 'NPC/tutorial hook and next-action clarity.', confidence: 0.54 },
      { id: 'portal_space', role: 'portal', roomId: 'primary_hall', purpose: 'Primary progression socket or teleport fiction.', confidence: isPortal ? 0.76 : 0.52 },
      { id: 'combat_space', role: 'combat', roomId: 'portal_destination_future', purpose: 'Future linked combat space, not required inside the first hub shell.', confidence: 0.42 },
      { id: 'social_space', role: 'social', roomId: 'entry_foyer', purpose: 'Idle/chat zone near spawn without covering objectives.', confidence: 0.6 },
      { id: 'reward_space', role: 'reward', roomId: 'reward_room', purpose: 'Chest/leaderboard/completion feedback after main action.', confidence: 0.57 },
    ],
    cinematicMoments: [
      { marker: 'FirstReveal', triggerRoom: 'entry_foyer', cue: 'Camera/lighting reveals the portal or hero structure.', confidence: 0.61 },
      { marker: 'PortalActivation', triggerRoom: 'primary_hall', cue: 'VFX/audio pulse frames the central objective.', confidence: isPortal ? 0.72 : 0.5 },
    ],
    playerGuidance: [
      'Use floor inlays and light bands to pull the eye from spawn to entry to primary hall.',
      'Keep optional rooms visible but secondary.',
      'Use strong signage or NPC silhouette for quest/shop choices.',
    ],
    mobileReadability: [
      'Main route should stay wider than 14 studs.',
      'Avoid dense particles at eye level on the first route.',
      'Keep portal prompt clear and not hidden behind glow.',
    ],
  };
}

module.exports = {
  createGameplaySpacePlan,
};

