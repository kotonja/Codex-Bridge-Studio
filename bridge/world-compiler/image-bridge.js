'use strict';

const ReferenceLab = require('../reference-lab');
const { base, quote, stableCompilerId } = require('./schema');
const { buildPackage } = require('./package-builder');

function goalFromImageReport(report = {}) {
  const metadata = report.imageMetadata || {};
  if (report.actualVisionUsed) {
    const scene = report.sceneUnderstanding || {};
    const style = report.styleProfile || {};
    const objects = (report.objectCandidates || []).map((item) => item.name).filter(Boolean).slice(0, 6);
    const colors = (style.colorPalette || []).slice(0, 5);
    const focal = (scene.focalPoints || []).slice(0, 4);
    return [
      style.genreGuess || 'image reference',
      scene.sceneType || 'Roblox world',
      colors.length ? `colors ${colors.join(', ')}` : '',
      focal.length ? `focal points ${focal.join(', ')}` : '',
      objects.length ? `objects ${objects.join(', ')}` : '',
    ].filter(Boolean).join('; ');
  }
  return [
    'local image reference',
    metadata.fileName || metadata.displayPath || 'unnamed image',
    metadata.extension ? `extension ${metadata.extension}` : '',
    metadata.dimensions ? `size ${metadata.dimensions.width}x${metadata.dimensions.height}` : '',
    metadata.byteSize ? `${metadata.byteSize} bytes` : '',
  ].filter(Boolean).join('; ');
}

async function getWorldCompilerImageReport(imagePath = '', options = {}) {
  const imageAnalysis = await ReferenceLab.analyzeImageFile(imagePath, {
    ...options,
    source: options.source || 'worldCompiler.image',
  });
  const goal = goalFromImageReport(imageAnalysis);
  if (!imageAnalysis.available) {
    return base({
      goal,
      compilerId: stableCompilerId(goal),
      mode: 'unavailable',
      imageAnalysis,
      compile: null,
      package: null,
      executePreview: null,
      createdNothingYet: true,
      requiresExecuteApply: true,
      actualVisionUsed: false,
      warnings: imageAnalysis.warnings || [],
      blockers: imageAnalysis.blockers || ['Provide a valid local image file before compiling.'],
      nextCommand: 'tools\\bridge.cmd reference image "<valid-local-image-path>"',
    });
  }

  const pkg = await buildPackage(goal, {
    ...options,
    source: options.source || 'worldCompiler.image',
    referenceReport: imageAnalysis,
    storeIntake: false,
  });
  const compile = {
    ok: true,
    version: pkg.version,
    goal: pkg.goal,
    compilerId: pkg.compilerId,
    status: pkg.blockers && pkg.blockers.length ? 'blocked' : (pkg.manualRequired && pkg.manualRequired.length ? 'manualRequired' : 'compiled'),
    actualVisionUsed: Boolean(imageAnalysis.actualVisionUsed),
    reference: pkg.referenceProfile,
    reconstruction: pkg.reconstructionProfile,
    worldgen: pkg.worldgenGraph,
    assetForge: pkg.assetKitPlan,
    cinematic: pkg.cinematicPlan,
    qa: pkg.qaPlan,
    scores: pkg.scores,
    createdNothingYet: true,
    requiresExecuteApply: true,
    warnings: pkg.warnings,
    blockers: pkg.blockers,
    nextCommand: `tools\\bridge.cmd execute preview ${quote(pkg.goal)}`,
  };
  return base({
    goal: pkg.goal,
    compilerId: pkg.compilerId,
    mode: imageAnalysis.actualVisionUsed ? 'apiVisionWorldCompile' : 'metadataOnlyWorldCompile',
    imageAnalysis,
    compile,
    package: pkg,
    executePreview: pkg.executionPreviewPlan,
    createdNothingYet: true,
    requiresExecuteApply: true,
    actualVisionUsed: Boolean(imageAnalysis.actualVisionUsed),
    warnings: pkg.warnings,
    blockers: pkg.blockers,
    nextCommand: `tools\\bridge.cmd execute preview ${quote(pkg.goal)}`,
  });
}

module.exports = {
  getWorldCompilerImageReport,
  goalFromImageReport,
};
