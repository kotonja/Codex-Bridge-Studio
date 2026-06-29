'use strict';

function route(id, roomIds, readability, risks) {
  return {
    id,
    waypoints: roomIds.map((roomId, index) => ({ id: `${id}_wp_${index + 1}`, roomId, label: roomId.replace(/_/g, ' ') })),
    roomIds,
    readabilityGoals: readability,
    expectedPlayerConfusionRisks: risks,
    qaCommandSuggestions: [
      `tools\\bridge.cmd qa route "${id}"`,
      `tools\\bridge.cmd test plan "${id}"`,
    ],
  };
}

function createRoutes() {
  return [
    route('spawn_to_entry', ['spawn_front_plaza', 'entry_foyer'], ['front entrance visible immediately', 'no side UI clutter'], ['spawn may face away if camera is not aligned']),
    route('entry_to_primary_goal', ['entry_foyer', 'primary_hall', 'portal_threshold'], ['central portal/goal framed by light and floor path'], ['portal VFX may obscure activation prompt']),
    route('entry_to_shop', ['entry_foyer', 'primary_hall', 'side_shop'], ['shop visible as optional branch', 'does not block main route'], ['shop signage too small on mobile']),
    route('entry_to_quest', ['entry_foyer', 'primary_hall', 'quest_room'], ['NPC/quest marker visible from main hall'], ['NPC silhouette blends into props']),
    route('entry_to_portal', ['entry_foyer', 'primary_hall', 'portal_threshold'], ['portal centerline reads as primary destination'], ['portal collision unclear']),
    route('entry_to_reward', ['entry_foyer', 'primary_hall', 'reward_room'], ['reward space reads after return, not before'], ['reward glow may distract first-time players']),
    route('full_loop', ['spawn_front_plaza', 'entry_foyer', 'primary_hall', 'quest_room', 'portal_threshold', 'reward_room'], ['clear start, purpose, destination, reward'], ['loop may need stronger return signage']),
    route('secret_route_optional', ['primary_hall', 'blocked_back_service', 'secret_reward'], ['optional route is subtle but not required'], ['should stay blocked/deferred until designed']),
    route('mobile_safe_route', ['spawn_front_plaza', 'entry_foyer', 'primary_hall', 'portal_threshold'], ['wide path, low turns, strong silhouettes'], ['particle overdraw at portal can hide path edge']),
  ];
}

module.exports = {
  createRoutes,
};

