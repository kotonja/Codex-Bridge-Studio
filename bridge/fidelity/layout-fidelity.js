'use strict';

const { arr, clampScore, overlapScore } = require('./schema');

function scoreLayout(referenceEvidence = {}, studioEvidence = {}) {
  const ref = referenceEvidence.evidence || {};
  const scene = ref.sceneUnderstanding || {};
  const gameplay = ref.gameplayInterpretation || {};
  const graph = studioEvidence.worldcompile && studioEvidence.worldcompile.worldgen || {};
  const expected = [
    ...arr(scene.walkableAreasHypothesis),
    ...arr(scene.blockedAreasHypothesis),
    ...arr(scene.focalPoints),
    ...arr(gameplay.traversalRoute),
    ...arr(gameplay.interactionPoints),
  ];
  const observed = [
    studioEvidence.goal,
    ...(graph.zones || []),
    ...(graph.paths || []),
    ...(graph.qaRoutes || []),
  ];
  const overlap = overlapScore(expected, observed, { base: 45, span: 47, emptyScore: 72 });
  const routeBonus = graph.qaRoutes && graph.qaRoutes.length ? 6 : 0;
  return {
    id: 'layoutFidelity',
    score: clampScore(overlap + routeBonus),
    expected,
    observed,
  };
}

module.exports = { scoreLayout };
