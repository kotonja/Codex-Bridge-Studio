'use strict';

function createBuildPlan(goal, kitPlan) {
  const phases = [
    'create folder roots',
    'create family folders',
    'block out primitive fallbacks',
    'add trim/bevel language',
    'add material variants',
    'add signage/decal placeholders',
    'add VFX/audio/animation sockets',
    'add collision proxies',
    'add LOD/mobile fallbacks',
    'mirror premium/worldgen summaries',
    'run visual critique',
    'run asset audit',
  ];
  return {
    ok: true,
    version: kitPlan.version,
    goal,
    phases: phases.map((phase, index) => ({
      index: index + 1,
      phase,
      targetSections: Object.keys(kitPlan.sections).slice(index % 6, (index % 6) + 4),
      expectedCreatedPaths: [`Workspace.CodexAssetForge.${kitPlan.assetKitId}.${phase.replace(/[^A-Za-z0-9]+/g, '_')}`],
      command: `tools\\bridge.cmd assetforge generate "${goal}"`,
      safetyClassification: 'fullTrustCodexOwnedAssetForge',
      expectedQualityImprovement: `Improves ${phase} without editing production content.`,
      validationCheck: `tools\\bridge.cmd assetforge audit "${goal}"`,
    })),
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd assetforge generate "${goal}"`,
  };
}

module.exports = { createBuildPlan };
