'use strict';

const AssetForge = require('../assetforge');

function createAssetForgeBridge(goal, reference, reconstruction, worldgen) {
  const kit = AssetForge.createKitPlan(goal, { source: 'worldCompiler.assetforge' });
  const meshPlan = AssetForge.createMeshPlan(goal);
  const materialPlan = AssetForge.createMaterialPlan(goal);
  const socketPlan = AssetForge.createSocketPlan(goal);
  const budget = AssetForge.createBudgetReport(goal);
  const audit = AssetForge.createAuditReport(goal);
  return {
    ok: true,
    version: kit.version,
    goal: kit.goal,
    assetKitId: kit.assetKitId,
    assetFamilies: kit.assetFamilies,
    taxonomy: AssetForge.TAXONOMY,
    meshPlan,
    materialPlan,
    socketPlan,
    budget,
    audit,
    referenceMaterials: reference && reference.materialLanguage,
    worldSockets: worldgen && worldgen.sockets,
    reconstructionCollisionPlan: reconstruction && reconstruction.collisionZones,
    warnings: kit.warnings || [],
    blockers: kit.blockers || [],
    nextCommand: `tools\\bridge.cmd cinematic plan "${kit.goal.replace(/"/g, '\\"')}"`,
  };
}

module.exports = { createAssetForgeBridge };
