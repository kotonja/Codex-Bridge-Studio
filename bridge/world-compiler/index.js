'use strict';

const { VERSION, PIPELINE, base, quote } = require('./schema');
const { getStatus } = require('./status');
const { resolveIntake } = require('./intake-resolver');
const { buildPackage, createCompileReport } = require('./package-builder');
const { getWorldCompilerImageReport } = require('./image-bridge');
const { saveManifest } = require('./manifest-store');
const { rememberWorldCompilerPackage } = require('./memory-integration');

async function getWorldCompilerIntakeReport(input, options = {}) {
  return resolveIntake(input, options);
}

async function getWorldCompilerPlan(input, options = {}) {
  const intake = resolveIntake(input, { ...options, storeIntake: options.storeIntake !== false });
  return base({
    goal: intake.goal,
    compilerId: intake.compilerId,
    inputMode: intake.inputMode,
    actualVisionUsed: false,
    target: {
      worldType: require('./package-builder').inferWorldType(intake.goal),
      quality: 'premium',
      targetDevices: ['mobile', 'desktop'],
    },
    pipeline: PIPELINE,
    confidence: intake.confidence,
    assumptions: [
      'V76 compiles a playable-world package; it does not claim Studio objects were created.',
      'V72 Execution Kernel is required for any actual Studio apply.',
    ],
    manualRequired: intake.manualRequired,
    warnings: intake.warnings,
    blockers: intake.blockers,
    nextCommand: `tools\\bridge.cmd worldcompile compile ${quote(intake.goal)}`,
  });
}

async function getWorldCompilerCompileReport(input, options = {}) {
  return createCompileReport(input, options);
}

async function getWorldCompilerPackage(input, options = {}) {
  const pkg = await buildPackage(input, options);
  if (pkg.status !== 'unavailable') {
    const stored = saveManifest(pkg);
    pkg.store = { relativeFile: stored.relativeFile };
  }
  return pkg;
}

async function pickPackage(input, picker, options = {}) {
  const pkg = await buildPackage(input, options);
  return picker(pkg);
}

async function getWorldCompilerWorldgenBridge(input, options = {}) {
  return pickPackage(input, (pkg) => base({
    goal: pkg.goal,
    compilerId: pkg.compilerId,
    worldgen: pkg.worldgenGraph,
    warnings: pkg.warnings,
    blockers: pkg.blockers,
    nextCommand: `tools\\bridge.cmd worldgen graph ${quote(pkg.goal)}`,
  }), options);
}

async function getWorldCompilerAssetKitBridge(input, options = {}) {
  return pickPackage(input, (pkg) => base({
    goal: pkg.goal,
    compilerId: pkg.compilerId,
    assetKit: pkg.assetKitPlan,
    warnings: pkg.warnings,
    blockers: pkg.blockers,
    nextCommand: `tools\\bridge.cmd assetforge kit ${quote(pkg.goal)}`,
  }), options);
}

async function getWorldCompilerCinematicBridge(input, options = {}) {
  return pickPackage(input, (pkg) => base({
    goal: pkg.goal,
    compilerId: pkg.compilerId,
    cinematic: pkg.cinematicPlan,
    warnings: pkg.warnings,
    blockers: pkg.blockers,
    nextCommand: `tools\\bridge.cmd cinematic plan ${quote(pkg.goal)}`,
  }), options);
}

async function getWorldCompilerQaBridge(input, options = {}) {
  return pickPackage(input, (pkg) => base({
    goal: pkg.goal,
    compilerId: pkg.compilerId,
    qa: pkg.qaPlan,
    warnings: pkg.warnings,
    blockers: pkg.blockers,
    nextCommand: `tools\\bridge.cmd qa launch ${quote(pkg.goal)}`,
  }), options);
}

async function getWorldCompilerExecutionPreview(input, options = {}) {
  return pickPackage(input, (pkg) => base({
    goal: pkg.goal,
    compilerId: pkg.compilerId,
    executionPreview: pkg.executionPreviewPlan,
    createdNothingYet: true,
    requiresExecuteApply: true,
    warnings: pkg.warnings,
    blockers: pkg.blockers,
    nextCommand: `tools\\bridge.cmd execute preview ${quote(pkg.goal)}`,
  }), options);
}

async function getWorldCompilerScore(input, options = {}) {
  return pickPackage(input, (pkg) => base({
    goal: pkg.goal,
    compilerId: pkg.compilerId,
    scores: pkg.scores || {},
    referenceFidelityScore: pkg.scores && pkg.scores.referenceFidelity,
    playabilityScore: pkg.scores && pkg.scores.playability,
    overallScore: pkg.scores && pkg.scores.overall,
    warnings: pkg.warnings,
    blockers: pkg.blockers,
    nextCommand: `tools\\bridge.cmd worldcompile execute-preview ${quote(pkg.goal)}`,
  }), options);
}

async function getWorldCompilerManifest(input, options = {}) {
  const pkg = await buildPackage(input, options);
  const stored = saveManifest(pkg);
  return base({
    goal: pkg.goal,
    compilerId: pkg.compilerId,
    manifest: pkg,
    store: { relativeFile: stored.relativeFile },
    warnings: pkg.warnings,
    blockers: pkg.blockers,
    nextCommand: `tools\\bridge.cmd worldcompile remember ${quote(pkg.goal)}`,
  });
}

async function rememberWorldCompiler(input, options = {}) {
  const pkg = await buildPackage(input, options);
  return rememberWorldCompilerPackage(pkg, options);
}

module.exports = {
  VERSION,
  buildPackage,
  getStatus,
  getWorldCompilerAssetKitBridge,
  getWorldCompilerCinematicBridge,
  getWorldCompilerCompileReport,
  getWorldCompilerExecutionPreview,
  getWorldCompilerIntakeReport,
  getWorldCompilerImageReport,
  getWorldCompilerManifest,
  getWorldCompilerPackage,
  getWorldCompilerPlan,
  getWorldCompilerQaBridge,
  getWorldCompilerScore,
  getWorldCompilerWorldgenBridge,
  rememberWorldCompiler,
};
