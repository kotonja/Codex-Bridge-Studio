'use strict';

const { base, clamp01, clampScore, PIPELINE, quote, stableCompilerId } = require('./schema');
const { resolveIntake } = require('./intake-resolver');
const { createReferenceBridge } = require('./reference-bridge');
const { createReconstructionBridge } = require('./reconstruction-bridge');
const { createPremiumBridge } = require('./premium-bridge');
const { createWorldgenBridge } = require('./worldgen-bridge');
const { createAssetForgeBridge } = require('./assetforge-bridge');
const { createCinematicBridge } = require('./cinematic-bridge');
const { createQaBridge } = require('./qa-bridge');
const { createExecutionPreviewBridge } = require('./execution-bridge');
const { scoreReferenceFidelity } = require('./fidelity-score');
const { scorePlayability } = require('./playability-score');
const { createPolicyReport } = require('./compile-policy');

function inferWorldType(goal = '') {
  const q = String(goal).toLowerCase();
  if (q.includes('dungeon')) return 'dungeon';
  if (q.includes('boss')) return 'bossArena';
  if (q.includes('arena')) return 'arena';
  if (q.includes('hub') || q.includes('lobby')) return 'hub';
  if (q.includes('house') || q.includes('mansion')) return 'house';
  if (q.includes('village') || q.includes('town')) return 'village';
  if (q.includes('obby')) return 'obby';
  if (q.includes('simulator')) return 'simulatorPlaza';
  return 'unknown';
}

function buildAcceptanceGates(goal) {
  return [
    { id: 'referenceFidelity', requirement: 'Primary silhouette, focal colors, material language, and landmark hierarchy are represented.', command: `tools\\bridge.cmd visual critique ${quote(goal)}` },
    { id: 'playability', requirement: 'Spawn, main route, objective, portal/shop/reward sockets, and return loop are readable in the first 10 seconds.', command: `tools\\bridge.cmd qa route ${quote(goal)}` },
    { id: 'assetReadiness', requirement: 'Asset kit families, sockets, collision proxies, and mobile fallbacks exist before final build.', command: `tools\\bridge.cmd assetforge kit ${quote(goal)}` },
    { id: 'executionSafety', requirement: 'Any real Studio build is previewed, applied, verified, and rollbackable through V72.', command: `tools\\bridge.cmd execute preview ${quote(goal)}` },
  ];
}

function scorePackage(parts) {
  const fidelity = scoreReferenceFidelity(parts.reference, parts.reconstruction);
  const playability = scorePlayability(parts.worldgen, parts.reconstruction, parts.qa);
  const scores = {
    referenceFidelity: fidelity.score,
    structuralCompleteness: clampScore((Number(parts.reconstruction && parts.reconstruction.overallConfidence) || 0.55) * 100 + 22),
    playability: playability.score,
    assetReadiness: clampScore(parts.assetForge && parts.assetForge.audit ? parts.assetForge.audit.overallScore || 78 : 72),
    cinematicReadiness: clampScore(parts.cinematic && parts.cinematic.timeline ? 80 : 62),
    qaReadiness: clampScore(parts.qa && parts.qa.launchReadiness ? parts.qa.launchReadiness.launchReadinessScore || 76 : 68),
    executionReadiness: clampScore(parts.executionPreview && parts.executionPreview.previewOnly ? 84 : 40),
  };
  const weights = {
    referenceFidelity: 1.2,
    structuralCompleteness: 1,
    playability: 1.4,
    assetReadiness: 1,
    cinematicReadiness: 0.8,
    qaReadiness: 1.1,
    executionReadiness: 1,
  };
  let total = 0;
  let weightTotal = 0;
  for (const [key, value] of Object.entries(scores)) {
    total += value * weights[key];
    weightTotal += weights[key];
  }
  const blockerPenalty = (parts.blockers || []).length * 8 + (parts.manualRequired || []).length * 3;
  scores.overall = clampScore(total / weightTotal - blockerPenalty);
  scores.referenceFidelityDetail = fidelity.subScores;
  scores.playabilityDetail = playability.subScores;
  return scores;
}

async function buildPackage(input = '', options = {}) {
  const intake = resolveIntake(input, { ...options, storeIntake: options.storeIntake !== false });
  const goal = intake.goal;
  const compilerId = intake.compilerId || stableCompilerId(goal);
  if (!intake.available) {
    const unavailable = base({
      goal,
      compilerId,
      packageId: compilerId,
      inputMode: 'unavailable',
      status: 'unavailable',
      actualVisionUsed: false,
      confidence: 0,
      referenceProfile: null,
      reconstructionProfile: null,
      worldgenGraph: null,
      assetKitPlan: null,
      cinematicPlan: null,
      qaPlan: null,
      executionPreviewPlan: null,
      memoryLinks: [],
      fidelityTargets: [],
      playabilityTargets: [],
      acceptanceGates: buildAcceptanceGates(goal),
      manualRequired: intake.manualRequired,
      warnings: intake.warnings,
      blockers: intake.blockers,
      nextCommands: ['tools\\bridge.cmd worldcompile intake "<reference-or-goal>"'],
      nextCommand: 'tools\\bridge.cmd worldcompile intake "<reference-or-goal>"',
    });
    return unavailable;
  }

  const reference = await createReferenceBridge(goal, options);
  const reconstruction = await createReconstructionBridge(goal);
  const premiumPlan = createPremiumBridge(goal, reference, reconstruction);
  const worldgen = createWorldgenBridge(goal, reconstruction);
  const assetForge = createAssetForgeBridge(goal, reference, reconstruction, worldgen);
  const cinematic = createCinematicBridge(goal, reference, worldgen);
  const qa = createQaBridge(goal, worldgen, assetForge, cinematic);
  const executionPreview = createExecutionPreviewBridge(goal, { packageId: compilerId });
  const warnings = [
    ...(intake.warnings || []),
    ...(reference.warnings || []),
    ...(reconstruction.warnings || []),
    ...(worldgen.warnings || []),
    ...(assetForge.warnings || []),
    ...(cinematic.warnings || []),
    ...(qa.warnings || []),
    ...(executionPreview.warnings || []),
  ];
  const blockers = [
    ...(intake.blockers || []),
    ...(reference.blockers || []),
    ...(reconstruction.blockers || []),
    ...(worldgen.blockers || []),
    ...(assetForge.blockers || []),
    ...(cinematic.blockers || []),
    ...(qa.blockers || []),
    ...(executionPreview.blockers || []),
  ];
  const manualRequired = [];
  if (!reference.actualVisionUsed && (intake.inputMode === 'localImage' || intake.inputMode === 'folder')) {
    manualRequired.push('Real image/pixel analysis was not used; compile relies on metadata, path/name, and note-like signals until API vision or a written reference is supplied.');
  }
  const confidence = clamp01(((reference.confidence || 0.55) + (reconstruction.overallConfidence || 0.55) + 0.68) / 3);
  const packageObject = base({
    packageId: compilerId,
    compilerId,
    goal,
    inputMode: intake.inputMode,
    actualVisionUsed: Boolean(reference.actualVisionUsed),
    target: {
      worldType: inferWorldType(goal),
      quality: 'premium',
      targetDevices: ['mobile', 'desktop'],
    },
    pipeline: PIPELINE,
    confidence,
    referenceProfile: reference,
    reconstructionProfile: reconstruction,
    premiumPlan,
    worldgenGraph: worldgen,
    assetKitPlan: assetForge,
    cinematicPlan: cinematic,
    qaPlan: qa,
    executionPreviewPlan: executionPreview,
    memoryLinks: [],
    fidelityTargets: [
      'primary silhouette readable from spawn',
      'reference material language translated into Roblox-safe materials',
      'focal hierarchy preserved without noisy clutter',
    ],
    playabilityTargets: [
      'spawn clarity',
      'wide main route',
      'objective/portal/shop/reward sockets',
      'mobile-safe collision and readability',
    ],
    acceptanceGates: buildAcceptanceGates(goal),
    assumptions: [
      'This is a playable-world compile package, not a claim that Studio objects were created.',
      'If real image pixels were not analyzed, style and structure come from reference text/path metadata and safe inference.',
    ],
    manualRequired,
    warnings,
    blockers,
    nextCommands: [
      `tools\\bridge.cmd worldcompile score ${quote(goal)}`,
      `tools\\bridge.cmd execute preview ${quote(goal)}`,
      `tools\\bridge.cmd visual critique ${quote(goal)}`,
      `tools\\bridge.cmd qa launch ${quote(goal)}`,
    ],
    createdNothingYet: true,
    requiresExecuteApply: true,
    policy: createPolicyReport(),
  });
  packageObject.scores = scorePackage({
    reference,
    reconstruction,
    worldgen,
    assetForge,
    cinematic,
    qa,
    executionPreview,
    blockers,
    manualRequired,
  });
  packageObject.nextCommand = `tools\\bridge.cmd execute preview ${quote(goal)}`;
  return packageObject;
}

async function createCompileReport(input = '', options = {}) {
  const pkg = await buildPackage(input, options);
  if (pkg.status === 'unavailable') {
    return base({
      goal: pkg.goal,
      compilerId: pkg.compilerId,
      status: 'unavailable',
      actualVisionUsed: false,
      confidence: 0,
      manualRequired: pkg.manualRequired,
      warnings: pkg.warnings,
      blockers: pkg.blockers,
      createdNothingYet: true,
      requiresExecuteApply: true,
      nextCommand: pkg.nextCommand,
    });
  }
  return base({
    goal: pkg.goal,
    compilerId: pkg.compilerId,
    status: pkg.blockers.length ? 'blocked' : (pkg.manualRequired.length ? 'manualRequired' : 'compiled'),
    actualVisionUsed: pkg.actualVisionUsed,
    inputMode: pkg.inputMode,
    target: pkg.target,
    confidence: pkg.confidence,
    reference: pkg.referenceProfile,
    reconstruction: pkg.reconstructionProfile,
    premiumPlan: pkg.premiumPlan,
    worldgen: pkg.worldgenGraph,
    assetForge: pkg.assetKitPlan,
    cinematic: pkg.cinematicPlan,
    qa: pkg.qaPlan,
    executionPreview: pkg.executionPreviewPlan,
    scores: pkg.scores,
    createdNothingYet: true,
    requiresExecuteApply: true,
    assumptions: pkg.assumptions,
    manualRequired: pkg.manualRequired,
    warnings: pkg.warnings,
    blockers: pkg.blockers,
    nextCommand: pkg.nextCommand,
  });
}

module.exports = {
  buildAcceptanceGates,
  buildPackage,
  createCompileReport,
  inferWorldType,
  scorePackage,
};
