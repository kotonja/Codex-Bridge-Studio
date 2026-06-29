'use strict';

const { VERSION, base, safeText, stableReconstructionId } = require('./schema');
const { getStatus } = require('./status');
const { resolveReference } = require('./reference-resolver');
const { classifyGoal, TAXONOMY } = require('./spatial-taxonomy');
const { assembleReport, buildParts } = require('./structure-inference');
const { saveManifest } = require('./manifest-store');
const { rememberReconstructionProfile } = require('./memory-integration');

async function createInferenceReport(input = '', options = {}) {
  const ctx = await resolveReference(input, options);
  const taxonomy = classifyGoal(ctx.goal);
  const parts = buildParts(ctx, taxonomy);
  return assembleReport(ctx, parts);
}

async function pick(input, picker) {
  const report = await createInferenceReport(input);
  return picker(report);
}

async function getStructuralReconstructionPlan(input) {
  return pick(input, (report) => base({
    goal: report.goal,
    referenceId: report.referenceId,
    reconstructionId: report.reconstructionId,
    actualVisionUsed: report.actualVisionUsed,
    structurePlan: report.structurePlan,
    safeInferences: report.safeInferences,
    uncertainInferences: report.uncertainInferences,
    nextCommand: `tools\\bridge.cmd reconstruct floorplan "${report.goal}"`,
  }));
}

async function getInteriorInferencePlan(input) {
  return pick(input, (report) => base({
    goal: report.goal,
    referenceId: report.referenceId,
    actualVisionUsed: report.actualVisionUsed,
    interiorPlan: report.interiorPlan,
    rooms: report.interiorPlan.rooms,
    verticalLinks: report.interiorPlan.verticalLinks,
    confidence: report.interiorPlan.confidence,
    nextCommand: `tools\\bridge.cmd reconstruct floorplan "${report.goal}"`,
  }));
}

async function getExteriorCompletionPlan(input) {
  return pick(input, (report) => base({
    goal: report.goal,
    referenceId: report.referenceId,
    actualVisionUsed: report.actualVisionUsed,
    exteriorCompletion: report.exteriorCompletion,
    nextCommand: `tools\\bridge.cmd reconstruct backside "${report.goal}"`,
  }));
}

async function getBacksideInferencePlan(input) {
  return pick(input, (report) => base({
    goal: report.goal,
    referenceId: report.referenceId,
    actualVisionUsed: report.actualVisionUsed,
    backsidePlan: report.backsidePlan,
    alternatives: report.backsidePlan.alternatives,
    nextCommand: `tools\\bridge.cmd reconstruct variants "${report.goal}"`,
  }));
}

async function getFloorplanInferencePlan(input) {
  return pick(input, (report) => base({
    goal: report.goal,
    referenceId: report.referenceId,
    actualVisionUsed: report.actualVisionUsed,
    floorplan: report.floorplan,
    nextCommand: `tools\\bridge.cmd reconstruct rooms "${report.goal}"`,
  }));
}

async function getRoomGraphPlan(input) {
  return pick(input, (report) => base({
    goal: report.goal,
    referenceId: report.referenceId,
    actualVisionUsed: report.actualVisionUsed,
    roomGraph: report.roomGraph,
    rooms: report.roomGraph.rooms,
    connections: report.roomGraph.connections,
    nextCommand: `tools\\bridge.cmd reconstruct routes "${report.goal}"`,
  }));
}

async function getRouteInferencePlan(input) {
  return pick(input, (report) => base({
    goal: report.goal,
    referenceId: report.referenceId,
    actualVisionUsed: report.actualVisionUsed,
    routes: report.routes,
    nextCommand: `tools\\bridge.cmd reconstruct gameplay "${report.goal}"`,
  }));
}

async function getGameplaySpacePlan(input) {
  return pick(input, (report) => base({
    goal: report.goal,
    referenceId: report.referenceId,
    actualVisionUsed: report.actualVisionUsed,
    gameplaySpaces: report.gameplaySpaces,
    nextCommand: `tools\\bridge.cmd reconstruct collisions "${report.goal}"`,
  }));
}

async function getCollisionInferencePlan(input) {
  return pick(input, (report) => base({
    goal: report.goal,
    referenceId: report.referenceId,
    actualVisionUsed: report.actualVisionUsed,
    collisionZones: report.collisionZones,
    nextCommand: `tools\\bridge.cmd reconstruct worldgen "${report.goal}"`,
  }));
}

async function getReconstructionVariants(input) {
  return pick(input, (report) => base({
    goal: report.goal,
    referenceId: report.referenceId,
    actualVisionUsed: report.actualVisionUsed,
    variants: report.variants,
    nextCommand: `tools\\bridge.cmd reconstruct worldgen "${report.goal}"`,
  }));
}

async function getWorldgenReconstructionBridge(input) {
  return pick(input, (report) => base({
    goal: report.goal,
    referenceId: report.referenceId,
    actualVisionUsed: report.actualVisionUsed,
    worldgen: report.productionBridge.worldgen,
    nextCommand: report.productionBridge.worldgen.nextCommand,
  }));
}

async function getAssetForgeReconstructionBridge(input) {
  return pick(input, (report) => base({
    goal: report.goal,
    referenceId: report.referenceId,
    actualVisionUsed: report.actualVisionUsed,
    assetforge: report.productionBridge.assetforge,
    nextCommand: report.productionBridge.assetforge.nextCommand,
  }));
}

async function getExecutionReconstructionPlan(input) {
  return pick(input, (report) => base({
    goal: report.goal,
    referenceId: report.referenceId,
    actualVisionUsed: report.actualVisionUsed,
    executionPlan: report.productionBridge.execution,
    nextCommand: report.productionBridge.execution.nextCommand,
  }));
}

async function getReconstructionManifest(input) {
  const report = await createInferenceReport(input);
  const manifest = {
    version: VERSION,
    reconstructionId: report.reconstructionId,
    referenceId: report.referenceId,
    goal: report.goal,
    sourceMode: report.sourceMode,
    actualVisionUsed: report.actualVisionUsed,
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
  };
  const stored = saveManifest(manifest);
  return base({
    goal: report.goal,
    reconstructionId: report.reconstructionId,
    referenceId: report.referenceId,
    manifest,
    store: { relativeFile: stored.relativeFile },
    nextCommand: `tools\\bridge.cmd reconstruct remember "${report.goal}"`,
  });
}

async function remember(input, options = {}) {
  const report = await createInferenceReport(input);
  return rememberReconstructionProfile(report, options);
}

function getCatalog() {
  return base({
    taxonomy: TAXONOMY,
    commands: [
      'reconstruct infer',
      'reconstruct interior',
      'reconstruct backside',
      'reconstruct floorplan',
      'reconstruct worldgen',
      'reconstruct assetforge',
      'reconstruct execute-plan',
    ],
    nextCommand: 'tools\\bridge.cmd reconstruct infer "haunted mansion exterior reference"',
  });
}

module.exports = {
  VERSION,
  createInferenceReport,
  getAssetForgeReconstructionBridge,
  getBacksideInferencePlan,
  getCatalog,
  getCollisionInferencePlan,
  getExecutionReconstructionPlan,
  getExteriorCompletionPlan,
  getFloorplanInferencePlan,
  getGameplaySpacePlan,
  getInteriorInferencePlan,
  getReconstructionManifest,
  getReconstructionVariants,
  getRoomGraphPlan,
  getRouteInferencePlan,
  getStatus,
  getStructuralReconstructionPlan,
  getWorldgenReconstructionBridge,
  remember,
  safeText,
  stableReconstructionId,
};

