'use strict';

const { arr, clampScore, overlapScore, safeText } = require('./schema');

function objectNames(referenceEvidence = {}) {
  const ref = referenceEvidence.evidence || {};
  return Array.isArray(ref.objectCandidates)
    ? ref.objectCandidates.map((item) => safeText(item.name || item.id || item.role)).filter(Boolean)
    : [];
}

function scoreObjectCoverage(referenceEvidence = {}, studioEvidence = {}) {
  const expected = objectNames(referenceEvidence);
  const graph = studioEvidence.worldcompile && studioEvidence.worldcompile.worldgen || {};
  const observed = [
    studioEvidence.goal,
    ...(graph.landmarks || []),
    ...(graph.zones || []),
    ...(studioEvidence.worldcompile && studioEvidence.worldcompile.assetFamilies || []),
  ];
  const score = overlapScore(expected, observed, { base: 38, span: 58, emptyScore: 70 });
  const covered = expected.filter((item) => overlapScore([item], observed, { base: 0, span: 100, emptyScore: 0 }) > 55);
  return {
    id: 'objectCoverage',
    score: clampScore(score),
    expected,
    observed,
    covered,
    missing: expected.filter((item) => !covered.includes(item)),
  };
}

module.exports = {
  objectNames,
  scoreObjectCoverage,
};
