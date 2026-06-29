'use strict';

function createAssetForgeBridge(ctx) {
  return {
    goal: ctx.goal,
    assetFamilies: [
      { id: 'modular_walls', includes: ['front slabs', 'side panels', 'back variants', 'corner columns'], priority: 'high' },
      { id: 'doors_windows_openings', includes: ['front doorway', 'side windows', 'blocked rear service door'], priority: 'high' },
      { id: 'trim_and_roof', includes: ['gold/dark trim bands', 'roof cap parts', 'edge bevels'], priority: 'medium' },
      { id: 'floor_tiles_and_routes', includes: ['main path floor inlays', 'room boundary tiles', 'activation pad'], priority: 'high' },
      { id: 'room_props', includes: ['shop display', 'NPC pedestal', 'reward chest', 'signage'], priority: 'medium' },
      { id: 'collision_proxies', includes: ['wall proxy boxes', 'portal blocker', 'railing proxies'], priority: 'high' },
    ],
    materialPalette: [
      'dark stone or slate base',
      'purple emissive portal glass',
      'gold/bronze trim',
      'cool blue rim lights',
      'low-overdraw particle accents',
    ],
    socketPlan: [
      { id: 'portal_vfx_socket', target: 'primary_hall.portal_threshold' },
      { id: 'shop_ui_socket', target: 'side_shop.counter' },
      { id: 'quest_prompt_socket', target: 'quest_room.npc_platform' },
      { id: 'reward_vfx_socket', target: 'reward_room.chest_pedestal' },
    ],
    nextCommand: `tools\\bridge.cmd assetforge kit "${ctx.goal.replace(/"/g, '\\"')}"`,
  };
}

module.exports = {
  createAssetForgeBridge,
};

