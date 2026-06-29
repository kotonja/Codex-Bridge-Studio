'use strict';

const { base, safeText } = require('./schema');

function createCompareReport(refA, refB, analysisA, analysisB) {
  return base({
    refA: safeText(refA),
    refB: safeText(refB),
    comparison: {
      styleOverlap: compareArray(analysisA.styleProfile.colorPalette, analysisB.styleProfile.colorPalette),
      materialOverlap: compareArray(analysisA.materialLanguage.likelyMaterials, analysisB.materialLanguage.likelyMaterials),
      strongerForWorldgen: analysisA.layoutHypotheses.length >= analysisB.layoutHypotheses.length ? 'refA' : 'refB',
      strongerForAssetForge: analysisA.objectCandidates.length >= analysisB.objectCandidates.length ? 'refA' : 'refB',
    },
    recommendations: [
      'Use refA for the dominant style if it has the stronger silhouette.',
      'Use refB for secondary props/material variants if it adds readable variety.',
      'Run visual compare after a generated blockout exists.',
    ],
    nextCommand: `tools\\bridge.cmd reference manifest "${safeText(refA || refB)}"`,
  });
}

function compareArray(a = [], b = []) {
  const left = new Set((a || []).map((value) => String(value).toLowerCase()));
  const shared = (b || []).filter((value) => left.has(String(value).toLowerCase()));
  return { shared, count: shared.length };
}

module.exports = {
  createCompareReport,
};
