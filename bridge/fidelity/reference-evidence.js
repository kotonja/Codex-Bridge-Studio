'use strict';

const fs = require('node:fs');
const ReferenceLab = require('../reference-lab');
const { arr, base, quote, safeGoal, safeText } = require('./schema');

function looksLikeImagePath(input = '') {
  return /\.(png|jpe?g|webp|gif|bmp)$/i.test(String(input || ''));
}

function productionGoalFromReport(report = {}, fallback = '') {
  const style = report.styleProfile || {};
  const scene = report.sceneUnderstanding || {};
  const objects = arr(report.objectCandidates && report.objectCandidates.map((item) => item && item.name)).slice(0, 7);
  const colors = arr(style.colorPalette).slice(0, 6);
  const focal = arr(scene.focalPoints).slice(0, 5);
  const parts = [
    style.genreGuess,
    scene.sceneType,
    colors.length ? `colors ${colors.join(', ')}` : '',
    focal.length ? `focal points ${focal.join(', ')}` : '',
    objects.length ? `objects ${objects.join(', ')}` : '',
  ].filter(Boolean);
  return safeGoal(parts.join('; ') || report.goal || fallback);
}

function summarizeReference(report = {}) {
  return {
    referenceId: report.referenceId || null,
    mode: report.mode || 'unknown',
    actualVisionUsed: Boolean(report.actualVisionUsed),
    confidence: report.confidence || 0,
    styleProfile: report.styleProfile || {},
    sceneUnderstanding: report.sceneUnderstanding || {},
    materialLanguage: report.materialLanguage || {},
    objectCandidates: Array.isArray(report.objectCandidates) ? report.objectCandidates : [],
    layoutHypotheses: Array.isArray(report.layoutHypotheses) ? report.layoutHypotheses : [],
    gameplayInterpretation: report.gameplayInterpretation || {},
    missingViews: Array.isArray(report.missingViews) ? report.missingViews : [],
    productionHints: report.productionHints || {},
    imageMetadata: report.imageMetadata || (report.intake && report.intake.imageMetadata) || null,
    privacy: report.privacy || (report.intake && report.intake.privacy) || null,
  };
}

async function createReferenceEvidence(input = '', options = {}) {
  const source = safeGoal(input, 'reference fidelity source');
  const shouldUseImage = (looksLikeImagePath(source) && fs.existsSync(source)) || options.forceImage === true;
  const report = shouldUseImage
    ? await ReferenceLab.analyzeImageFile(source, { ...options, source: options.source || 'fidelity.reference.image' })
    : await ReferenceLab.analyzeReference(source, { ...options, source: options.source || 'fidelity.reference.profile', storeIntake: false });
  const evidence = summarizeReference(report);
  const productionGoal = productionGoalFromReport(report, source);
  return base({
    goal: source,
    productionGoal,
    mode: report.actualVisionUsed ? 'imageVisionBased' : (shouldUseImage ? 'profileBased' : 'profileBased'),
    actualReferenceVisionUsed: Boolean(report.actualVisionUsed),
    sourceKind: shouldUseImage ? 'localImageFile' : 'referenceProfile',
    confidence: report.confidence || (report.actualVisionUsed ? 0.82 : 0.48),
    evidence,
    warnings: report.warnings || [],
    blockers: report.blockers || [],
    nextCommand: `tools\\bridge.cmd fidelity studio ${quote(productionGoal)}`,
  });
}

module.exports = {
  createReferenceEvidence,
  productionGoalFromReport,
};
