'use strict';

const { arr, overlapScore } = require('./schema');

function scoreMaterial(referenceEvidence = {}, studioEvidence = {}) {
  const ref = referenceEvidence.evidence || {};
  const material = ref.materialLanguage || {};
  const style = ref.styleProfile || {};
  const expected = [
    ...arr(style.materialPalette),
    ...arr(material.likelyMaterials),
    ...arr(material.surfaceFinish),
    ...arr(material.robloxBuiltInFallbacks),
    ...arr(material.materialVariantSuggestions),
  ];
  const observed = [
    studioEvidence.goal,
    ...(studioEvidence.worldcompile && studioEvidence.worldcompile.assetFamilies || []),
    ...(studioEvidence.visualCritique && studioEvidence.visualCritique.topProblems || []).map((item) => `${item.category} ${item.problem || ''} ${item.exactFix || ''}`),
  ];
  return {
    id: 'materialFidelity',
    score: overlapScore(expected, observed, { base: 42, span: 50, emptyScore: 70 }),
    expected,
    observed,
  };
}

module.exports = { scoreMaterial };
