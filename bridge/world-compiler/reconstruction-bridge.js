'use strict';

const Reconstruction = require('../reconstruction');

async function createReconstructionBridge(goal) {
  const report = await Reconstruction.createInferenceReport(goal, { source: 'worldCompiler.reconstruction' });
  return {
    ok: true,
    reconstructionId: report.reconstructionId,
    referenceId: report.referenceId,
    goal: report.goal,
    actualVisionUsed: Boolean(report.actualVisionUsed),
    overallConfidence: report.overallConfidence,
    shownElements: report.shownElements,
    missingElements: report.missingElements,
    safeInferences: report.safeInferences,
    uncertainInferences: report.uncertainInferences,
    floorplan: report.floorplan,
    roomGraph: report.roomGraph,
    routes: report.routes,
    gameplaySpaces: report.gameplaySpaces,
    collisionZones: report.collisionZones,
    variants: report.variants,
    productionBridge: report.productionBridge,
    warnings: report.warnings || [],
    blockers: report.blockers || [],
  };
}

module.exports = { createReconstructionBridge };
