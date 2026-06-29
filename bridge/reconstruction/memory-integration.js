'use strict';

const MemorySchema = require('../memory/schema');
const MemoryStorage = require('../memory/storage');
const { base } = require('./schema');

function rememberReconstructionProfile(report, options = {}) {
  const goal = report.goal || 'reconstruction profile';
  const payload = {
    goal,
    reconstructionId: report.reconstructionId,
    referenceId: report.referenceId,
    sourceMode: report.sourceMode,
    actualVisionUsed: Boolean(report.actualVisionUsed),
    overallConfidence: report.overallConfidence,
    shownElements: report.shownElements,
    missingElements: report.missingElements,
    safeInferences: report.safeInferences,
    uncertainInferences: report.uncertainInferences,
    floorplan: report.floorplan,
    roomGraphSummary: {
      roomCount: report.roomGraph && Array.isArray(report.roomGraph.rooms) ? report.roomGraph.rooms.length : 0,
      connectionCount: report.roomGraph && Array.isArray(report.roomGraph.connections) ? report.roomGraph.connections.length : 0,
    },
    worldgenBridge: report.productionBridge && report.productionBridge.worldgen,
    assetForgeBridge: report.productionBridge && report.productionBridge.assetforge,
    rawImageBytesStored: false,
  };
  const type = MemorySchema.TYPES.reconstructionProfile || MemorySchema.TYPES.referenceProfile || MemorySchema.TYPES.note;
  const item = MemorySchema.createMemoryItem(type, goal, payload, {
    source: options.source || 'reconstruction.remember',
    tags: ['reconstruction', 'v75', 'reference', 'floorplan'],
    summary: `Reconstruction profile learned for ${goal}.`,
  });
  const stored = MemoryStorage.writeItem(item, options);
  return base({
    status: 'remembered',
    goal,
    item: stored.item,
    relativeFile: stored.relativeFile,
    rawImageBytesStored: false,
    nextCommand: `tools\\bridge.cmd memory recall "${goal}"`,
  });
}

module.exports = {
  rememberReconstructionProfile,
};

