'use strict';

const MemorySchema = require('../memory/schema');
const MemoryStorage = require('../memory/storage');
const { base } = require('./schema');

function rememberWorldCompilerPackage(pkg, options = {}) {
  const goal = pkg.goal || 'world compiler package';
  const payload = {
    goal,
    packageId: pkg.packageId,
    compilerId: pkg.compilerId,
    inputMode: pkg.inputMode,
    actualVisionUsed: Boolean(pkg.actualVisionUsed),
    target: pkg.target,
    scores: pkg.scores,
    referenceSummary: {
      referenceId: pkg.referenceProfile && pkg.referenceProfile.referenceId,
      styleProfile: pkg.referenceProfile && pkg.referenceProfile.styleProfile,
      materialLanguage: pkg.referenceProfile && pkg.referenceProfile.materialLanguage,
    },
    reconstructionSummary: {
      reconstructionId: pkg.reconstructionProfile && pkg.reconstructionProfile.reconstructionId,
      overallConfidence: pkg.reconstructionProfile && pkg.reconstructionProfile.overallConfidence,
      floorplan: pkg.reconstructionProfile && pkg.reconstructionProfile.floorplan,
    },
    worldgenSummary: {
      graphId: pkg.worldgenGraph && pkg.worldgenGraph.graphId,
      zoneCount: pkg.worldgenGraph && Array.isArray(pkg.worldgenGraph.zones) ? pkg.worldgenGraph.zones.length : 0,
      pathCount: pkg.worldgenGraph && Array.isArray(pkg.worldgenGraph.paths) ? pkg.worldgenGraph.paths.length : 0,
    },
    assetKitSummary: {
      assetKitId: pkg.assetKitPlan && pkg.assetKitPlan.assetKitId,
      familyCount: pkg.assetKitPlan && Array.isArray(pkg.assetKitPlan.assetFamilies) ? pkg.assetKitPlan.assetFamilies.length : 0,
    },
    rawImageBytesStored: false,
  };
  const type = MemorySchema.TYPES.worldCompilerPackage || MemorySchema.TYPES.referenceProfile || MemorySchema.TYPES.note;
  const item = MemorySchema.createMemoryItem(type, goal, payload, {
    source: options.source || 'worldCompiler.remember',
    tags: ['worldcompile', 'v76', 'reference', 'playable-world'],
    summary: `World compiler package learned for ${goal}.`,
  });
  const stored = MemoryStorage.writeItem(item, options);
  return base({
    status: 'remembered',
    goal,
    item: stored.item,
    relativeFile: stored.relativeFile,
    rawImageBytesStored: false,
    nextCommand: `tools\\bridge.cmd memory recall "${goal.replace(/"/g, '\\"')}"`,
  });
}

module.exports = { rememberWorldCompilerPackage };
