'use strict';

const { arr, overlapScore } = require('./schema');

function scoreShape(referenceEvidence = {}, studioEvidence = {}) {
  const ref = referenceEvidence.evidence || {};
  const style = ref.styleProfile || {};
  const scene = ref.sceneUnderstanding || {};
  const expected = [
    ...arr(style.shapeLanguage),
    ...arr(style.silhouetteRules),
    ...arr(scene.majorStructures),
    ...arr(scene.focalPoints),
  ];
  const observed = [
    studioEvidence.goal,
    ...(studioEvidence.worldcompile && studioEvidence.worldcompile.worldgen && studioEvidence.worldcompile.worldgen.landmarks || []),
    ...(studioEvidence.worldcompile && studioEvidence.worldcompile.worldgen && studioEvidence.worldcompile.worldgen.zones || []),
  ];
  return {
    id: 'shapeLanguageFidelity',
    score: overlapScore(expected, observed, { base: 44, span: 50, emptyScore: 70 }),
    expected,
    observed,
  };
}

module.exports = { scoreShape };
