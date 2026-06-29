'use strict';

const { arr, clampScore, overlapScore } = require('./schema');

function scoreLighting(referenceEvidence = {}, studioEvidence = {}) {
  const ref = referenceEvidence.evidence || {};
  const style = ref.styleProfile || {};
  const material = ref.materialLanguage || {};
  const visualLighting = studioEvidence.visualCritique
    && studioEvidence.visualCritique.subScores
    && studioEvidence.visualCritique.subScores.lightingDepth;
  const expected = [
    ...arr(style.lightingLanguage),
    material.glow,
    ...arr(style.VFXLanguage),
  ];
  const observed = [
    studioEvidence.goal,
    visualLighting && visualLighting.reason,
    ...(studioEvidence.worldcompile && studioEvidence.worldcompile.worldgen && studioEvidence.worldcompile.worldgen.sockets || []),
  ];
  const overlap = overlapScore(expected, observed, { base: 42, span: 44, emptyScore: 68 });
  const visualScore = visualLighting ? Number(visualLighting.score) : 70;
  return {
    id: 'lightingMoodFidelity',
    score: clampScore((overlap + visualScore) / 2),
    expected,
    observed,
  };
}

module.exports = { scoreLighting };
