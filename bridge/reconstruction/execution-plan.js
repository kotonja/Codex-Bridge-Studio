'use strict';

function createExecutionPlan(ctx, report) {
  return {
    previewOnly: true,
    executionRequiresV72: true,
    mutatesStudioDirectly: false,
    goal: ctx.goal,
    codexOwnedRoots: [
      'Workspace.CodexReconstruction',
      'ReplicatedStorage.CodexReconstruction',
    ],
    markers: [
      { id: 'ReconSpawn', path: 'Workspace.CodexReconstruction.Markers.Spawn' },
      { id: 'ReconEntry', path: 'Workspace.CodexReconstruction.Markers.EntryFoyer' },
      { id: 'ReconPrimaryGoal', path: 'Workspace.CodexReconstruction.Markers.PrimaryHall' },
      { id: 'ReconShop', path: 'Workspace.CodexReconstruction.Markers.Shop' },
      { id: 'ReconQuest', path: 'Workspace.CodexReconstruction.Markers.Quest' },
      { id: 'ReconReward', path: 'Workspace.CodexReconstruction.Markers.Reward' },
    ],
    blockoutModels: report.roomGraph.rooms.map((room) => ({
      id: `${room.id}_blockout`,
      roomId: room.id,
      approxSize: room.approxSize,
      attributes: {
        CodexGenerated: true,
        CodexReconstructionRole: room.role,
        CodexReconstructionConfidence: room.confidence,
      },
    })),
    routeMarkers: report.routes.map((route) => ({ id: `${route.id}_route`, waypoints: route.waypoints })),
    collisionProxies: report.collisionZones.zones.filter((zone) => /collision|walls|clearance|block/.test(zone.type)).map((zone) => ({
      id: zone.id,
      behavior: zone.behavior,
      confidence: zone.confidence,
    })),
    manifestFolders: [
      'ReplicatedStorage.CodexReconstruction.Manifests',
      'ReplicatedStorage.CodexReconstruction.WorldgenBridge',
      'ReplicatedStorage.CodexReconstruction.AssetForgeBridge',
    ],
    blockedActions: [
      'No publish/upload/marketplace actions.',
      'No DataStore/save/economy mutation.',
      'No non-Codex object deletion or overwrite.',
    ],
    nextCommand: `tools\\bridge.cmd execute preview "${ctx.goal.replace(/"/g, '\\"')}"`,
  };
}

module.exports = {
  createExecutionPlan,
};

