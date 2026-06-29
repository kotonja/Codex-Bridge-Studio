'use strict';

const { arr, overlapScore } = require('./schema');

function scoreStyle(referenceEvidence = {}, studioEvidence = {}) {
  const ref = referenceEvidence.evidence || {};
  const style = ref.styleProfile || {};
  const observed = [
    studioEvidence.goal,
    studioEvidence.visualCritique && studioEvidence.visualCritique.rating,
    ...(studioEvidence.visualCritique && studioEvidence.visualCritique.bestStrengths || []).map((item) => `${item.category} ${item.evidence || ''}`),
    ...(studioEvidence.worldcompile && studioEvidence.worldcompile.assetFamilies || []),
  ];
  const expected = [
    style.genreGuess,
    ...arr(style.mood),
    ...arr(style.colorPalette),
    ...arr(style.shapeLanguage),
    ...arr(style.robloxTranslationNotes),
  ];
  return {
    id: 'styleFidelity',
    score: overlapScore(expected, observed, { base: 48, span: 48, emptyScore: 72 }),
    expected,
    observed,
  };
}

module.exports = { scoreStyle };
