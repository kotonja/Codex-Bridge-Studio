'use strict';

const ReferenceLab = require('../reference-lab');

async function createReferenceBridge(goal, options = {}) {
  const reference = options.referenceReport || await ReferenceLab.analyzeReference(goal, {
    source: options.source || 'worldCompiler.reference',
    storeIntake: options.storeIntake !== false,
  });
  return {
    ok: true,
    referenceId: reference.referenceId,
    goal: reference.goal,
    inputMode: reference.mode,
    actualVisionUsed: Boolean(reference.actualVisionUsed),
    confidence: reference.confidence || 0,
    styleProfile: reference.styleProfile,
    sceneUnderstanding: reference.sceneUnderstanding,
    materialLanguage: reference.materialLanguage,
    objectCandidates: reference.objectCandidates,
    focalHierarchy: reference.focalHierarchy,
    layoutHypotheses: reference.layoutHypotheses,
    gameplayInterpretation: reference.gameplayInterpretation,
    missingViews: reference.missingViews,
    productionHints: reference.productionHints,
    warnings: reference.warnings || [],
    blockers: reference.blockers || [],
    privacy: reference.intake && reference.intake.privacy,
  };
}

module.exports = { createReferenceBridge };
