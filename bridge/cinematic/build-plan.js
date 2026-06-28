'use strict';

function createBuildPlan(parsed, manifestPath) {
  return {
    packageId: parsed.packageId,
    workspacePath: `Workspace.CodexCinematicDirector.Cinematic_${parsed.packageId}`,
    manifestPath,
    premiumMirrorPath: `ReplicatedStorage.CodexPremiumDirector.Cinematic.${parsed.packageId}`,
    assetForgeSocketPath: `ReplicatedStorage.CodexAssetForge.CinematicSockets.${parsed.packageId}`,
    createdPaths: [
      `Workspace.CodexCinematicDirector.Cinematic_${parsed.packageId}`,
      manifestPath,
      `ReplicatedStorage.CodexPremiumDirector.Cinematic.${parsed.packageId}`,
      `ReplicatedStorage.CodexAssetForge.CinematicSockets.${parsed.packageId}`,
    ],
    attributes: {
      CodexGenerated: true,
      CodexSystem: 'CinematicDirector',
      CodexVersion: '0.72.0',
      CodexGoal: parsed.goal,
      CodexMomentType: parsed.momentType,
    },
  };
}

module.exports = { createBuildPlan };
