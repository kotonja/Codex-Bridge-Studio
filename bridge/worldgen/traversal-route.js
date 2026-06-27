'use strict';

const { TRAVERSAL_ROUTES, VERSION, nowIso, safeGoal } = require('./schema');

function routeWaypoints(graph, routeId) {
  const byRole = Object.fromEntries((graph.zones || []).map((zone) => [zone.role, zone.position]));
  const spawn = byRole.spawn || { x: 0, y: 0, z: 0 };
  const primary = byRole.primaryFocalPoint || { x: 0, y: 0, z: -90 };
  const targets = {
    spawn_to_primary_goal: [spawn, primary],
    spawn_to_shop: [spawn, byRole.shop || primary],
    spawn_to_quest: [spawn, byRole.quest || primary],
    spawn_to_portal: [spawn, byRole.portal || primary],
    spawn_to_training: [spawn, byRole.training || primary],
    full_loop: [spawn, primary, byRole.portal || primary, byRole.reward || spawn, spawn],
    mobile_readability_walk: [spawn, byRole.shop || primary, byRole.quest || primary, byRole.portal || primary],
    clutter_collision_sweep: [spawn, primary, byRole.combat || primary, spawn],
  };
  return targets[routeId] || [spawn, primary];
}

function createTraversalRoute(goal, graph) {
  const cleanGoal = safeGoal(goal || (graph && graph.goal));
  const routes = TRAVERSAL_ROUTES.map((id) => ({
    id,
    waypoints: routeWaypoints(graph || {}, id),
    expectedObservations: ['main landmark remains readable', 'path width feels comfortable on mobile', 'objective destination is visible or clearly signposted'],
    failureConditions: ['player loses sight of focal landmark', 'path appears blocked', 'UI/prompt anchor is too small or hidden', 'transparent clutter covers the route'],
    testCommand: `tools\\bridge.cmd test path .codex-studio\\worldgen\\${id}.json`,
  }));
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: cleanGoal,
    routes,
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd worldgen audit "${cleanGoal}"`,
  };
}

module.exports = { createTraversalRoute };
