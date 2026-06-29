'use strict';

const { overallConfidence } = require('./confidence');
const { base, inferenceItem, stableReconstructionId } = require('./schema');
const { createBacksidePlan } = require('./backside-inference');
const { createCollisionPlan } = require('./collision-inference');
const { createExteriorCompletionPlan } = require('./exterior-completion');
const { createFloorplan } = require('./floorplan-inference');
const { createGameplaySpacePlan } = require('./gameplay-space');
const { createInteriorPlan } = require('./interior-inference');
const { createRoomGraph } = require('./room-graph');
const { createRoutes } = require('./route-inference');
const { createVariants } = require('./variant-generator');
const { createWorldgenBridge } = require('./worldgen-bridge');
const { createAssetForgeBridge } = require('./assetforge-bridge');
const { createExecutionPlan } = require('./execution-plan');

function createSafeInferences(ctx, plans) {
  return [
    inferenceItem('structure.main_axis', 'Use a readable main axis from spawn/front to primary objective.', 'Roblox hubs and dungeon gates need instant route clarity, especially on mobile.', 0.76, {
      sourceEvidence: ctx.sourceEvidence,
      alternatives: ['radial hub', 'T-shaped entry'],
    }),
    inferenceItem('structure.block_decorative_shell', 'Treat ornate exterior shell thickness as blocked/decorative unless explicitly designed.', 'Unseen decorative mass creates collision and polish risks if made walkable by default.', 0.72, {
      sourceEvidence: ctx.sourceEvidence,
      alternatives: ['secret route variant', 'service hallway variant'],
    }),
    inferenceItem('structure.side_branches', 'Use optional side branches for shop, quest, and reward spaces.', 'This preserves the main path while making the reconstruction useful for real gameplay.', 0.58, {
      sourceEvidence: ctx.sourceEvidence,
      alternatives: ['all services outside', 'single open rotunda'],
    }),
    ...plans.interiorPlan.inferences,
    ...plans.exteriorCompletion.inferences,
    ...plans.collisionZones.inferences,
  ];
}

function createUncertainInferences(ctx, plans) {
  return [
    inferenceItem('uncertain.true_backside', 'Exact rear facade is unknown.', 'No rear image/top-down floorplan was provided, so backside must remain a variant.', plans.backsidePlan.confidence, {
      sourceEvidence: ctx.sourceEvidence,
      risk: 'high',
      alternatives: plans.backsidePlan.alternatives.map((item) => item.id),
      needsUserReference: true,
    }),
    inferenceItem('uncertain.upper_floor', 'Upper floor/balcony is optional unless reference shows vertical circulation.', 'Exterior height can imply upper space, but gameplay may not need it in first pass.', 0.42, {
      sourceEvidence: ctx.sourceEvidence,
      risk: 'medium',
      alternatives: ['single-level hub', 'upper balcony vista', 'locked future staircase'],
    }),
    inferenceItem('uncertain.exact_room_sizes', 'Room sizes are production estimates, not measured floorplan truth.', 'No architectural plan exists in the text/reference; dimensions are Roblox readability estimates.', plans.floorplan.confidence, {
      sourceEvidence: ctx.sourceEvidence,
      risk: 'medium',
      alternatives: ['scale down for mobile', 'scale up for social hub'],
    }),
  ];
}

function createStructurePlan(ctx, plans) {
  return {
    reconstructionId: stableReconstructionId(ctx.goal),
    taxonomy: plans.taxonomy,
    shell: plans.exteriorCompletion.modules,
    openings: plans.exteriorCompletion.openings,
    interiorSummary: plans.interiorPlan.summary,
    backside: {
      preferredVariant: plans.backsidePlan.preferredVariant,
      alternatives: plans.backsidePlan.alternatives,
    },
    playableSpaces: plans.gameplaySpaces.spaces,
    blockedDecorativeSpaces: plans.interiorPlan.inaccessibleSpaces,
    confidence: overallConfidence([
      ...plans.safeInferences,
      ...plans.uncertainInferences,
      { confidence: plans.floorplan.confidence },
    ]),
  };
}

function assembleReport(ctx, parts) {
  const safeInferences = createSafeInferences(ctx, parts);
  const uncertainInferences = createUncertainInferences(ctx, parts);
  const structurePlan = createStructurePlan(ctx, { ...parts, safeInferences, uncertainInferences });
  const report = base({
    reconstructionId: stableReconstructionId(ctx.goal),
    goal: ctx.goal,
    referenceId: ctx.referenceId,
    sourceMode: ctx.sourceMode,
    actualVisionUsed: ctx.actualVisionUsed,
    overallConfidence: overallConfidence([...safeInferences, ...uncertainInferences]),
    shownElements: ctx.shownElements,
    missingElements: ctx.missingElements,
    safeInferences,
    uncertainInferences,
    needsUserReference: uncertainInferences.filter((item) => item.needsUserReference).map((item) => ({
      id: item.id,
      reason: item.reason,
      suggestedReference: item.id.includes('backside') ? 'rear/side image or top-down plan' : 'additional interior/top-down reference',
    })),
    structurePlan,
    interiorPlan: parts.interiorPlan,
    exteriorCompletion: parts.exteriorCompletion,
    backsidePlan: parts.backsidePlan,
    floorplan: parts.floorplan,
    roomGraph: parts.roomGraph,
    routes: parts.routes,
    gameplaySpaces: parts.gameplaySpaces,
    collisionZones: parts.collisionZones,
    variants: parts.variants,
    productionBridge: {
      worldgen: null,
      assetforge: null,
      execution: null,
    },
    warnings: ctx.actualVisionUsed ? [] : ['actualVisionUsed is false; reconstruction is based on note/reference metadata, not pixel-level image analysis.'],
    blockers: [],
    nextCommand: `tools\\bridge.cmd reconstruct worldgen "${ctx.goal.replace(/"/g, '\\"')}"`,
  });
  report.productionBridge.worldgen = createWorldgenBridge(ctx, report);
  report.productionBridge.assetforge = createAssetForgeBridge(ctx, report);
  report.productionBridge.execution = createExecutionPlan(ctx, report);
  return report;
}

function buildParts(ctx, taxonomy) {
  const interiorPlan = createInteriorPlan(ctx);
  const roomGraph = createRoomGraph(ctx, interiorPlan);
  const floorplan = createFloorplan(ctx, roomGraph);
  const exteriorCompletion = createExteriorCompletionPlan(ctx);
  const backsidePlan = createBacksidePlan(ctx);
  const routes = createRoutes(ctx, roomGraph);
  const gameplaySpaces = createGameplaySpacePlan(ctx);
  const collisionZones = createCollisionPlan(ctx);
  const variants = createVariants(ctx);
  return {
    taxonomy,
    interiorPlan,
    roomGraph,
    floorplan,
    exteriorCompletion,
    backsidePlan,
    routes,
    gameplaySpaces,
    collisionZones,
    variants,
  };
}

module.exports = {
  assembleReport,
  buildParts,
  createStructurePlan,
};

