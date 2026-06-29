'use strict';

const Premium = require('../premium');

function createPremiumBridge(goal, reference, reconstruction) {
  const manifest = Premium.createPremiumManifest(goal, { source: 'worldCompiler.premium' });
  return {
    ok: true,
    version: manifest.version,
    goal: manifest.goal,
    productionBrief: manifest.productionBrief,
    styleBible: manifest.styleBible,
    performanceBudget: manifest.performanceBudget,
    qualityScore: manifest.qualityScore,
    referenceInfluence: {
      referenceId: reference && reference.referenceId,
      actualVisionUsed: Boolean(reference && reference.actualVisionUsed),
      styleSignals: reference && reference.styleProfile ? reference.styleProfile.shapeLanguage || [] : [],
    },
    reconstructionInfluence: {
      reconstructionId: reconstruction && reconstruction.reconstructionId,
      floorplanConfidence: reconstruction && reconstruction.floorplan ? reconstruction.floorplan.confidence : null,
    },
    warnings: manifest.warnings || [],
    blockers: manifest.blockers || [],
    nextCommand: `tools\\bridge.cmd premium score "${goal.replace(/"/g, '\\"')}"`,
  };
}

module.exports = { createPremiumBridge };
