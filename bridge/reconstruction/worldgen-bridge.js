'use strict';

function createWorldgenBridge(ctx, report) {
  return {
    version: report.version,
    goal: ctx.goal,
    zones: [
      { id: 'spawn_front_plaza', role: 'spawn', sourceRoom: 'entry_foyer', priority: 1 },
      { id: 'entry_foyer_zone', role: 'orientation', sourceRoom: 'entry_foyer', priority: 2 },
      { id: 'primary_hall_zone', role: 'primaryObjective', sourceRoom: 'primary_hall', priority: 1 },
      { id: 'shop_branch_zone', role: 'shop', sourceRoom: 'side_shop', priority: 3 },
      { id: 'quest_branch_zone', role: 'quest', sourceRoom: 'quest_room', priority: 3 },
      { id: 'reward_branch_zone', role: 'reward', sourceRoom: 'reward_room', priority: 4 },
    ],
    paths: report.routes.map((route) => ({ id: route.id, roomIds: route.roomIds, waypoints: route.waypoints })),
    landmarks: [
      { id: 'hero_gate_or_portal', roomId: 'primary_hall', visibility: 'from spawn/entry axis' },
      { id: 'front_facade_silhouette', roomId: 'entry_foyer', visibility: 'first viewport' },
    ],
    vistas: [
      { id: 'spawn_to_gate_vista', from: 'spawn_front_plaza', to: 'primary_hall', purpose: 'first impression and route clarity' },
    ],
    blockers: report.collisionZones.zones.filter((zone) => /blocked|collision|walls/.test(zone.type)).map((zone) => zone.id),
    lightingBeats: ['spawn warm key', 'entry rim', 'portal cool glow', 'reward accent'],
    sockets: [
      { id: 'portal_socket', roomId: 'primary_hall', type: 'VFX/interaction' },
      { id: 'npc_socket', roomId: 'quest_room', type: 'NPC/quest' },
      { id: 'shop_socket', roomId: 'side_shop', type: 'shop/UI' },
      { id: 'reward_socket', roomId: 'reward_room', type: 'reward chest/VFX' },
    ],
    qaRoutes: report.routes.map((route) => route.id),
    nextCommand: `tools\\bridge.cmd worldgen graph "${ctx.goal.replace(/"/g, '\\"')}"`,
  };
}

module.exports = {
  createWorldgenBridge,
};

