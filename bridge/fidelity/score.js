'use strict';

const { clampScore } = require('./schema');
const { scoreStyle } = require('./style-fidelity');
const { scoreShape } = require('./shape-fidelity');
const { scoreMaterial } = require('./material-fidelity');
const { scoreLighting } = require('./lighting-fidelity');
const { scoreLayout } = require('./layout-fidelity');
const { scoreObjectCoverage } = require('./object-fidelity');
const { createGameplayAdaptation } = require('./gameplay-adaptation');

function createFidelityScores(referenceEvidence = {}, studioEvidence = {}) {
  const style = scoreStyle(referenceEvidence, studioEvidence);
  const shape = scoreShape(referenceEvidence, studioEvidence);
  const material = scoreMaterial(referenceEvidence, studioEvidence);
  const lighting = scoreLighting(referenceEvidence, studioEvidence);
  const layout = scoreLayout(referenceEvidence, studioEvidence);
  const objectCoverage = scoreObjectCoverage(referenceEvidence, studioEvidence);
  const gameplay = createGameplayAdaptation(referenceEvidence, studioEvidence);
  const mobile = studioEvidence.worldcompile && studioEvidence.worldcompile.worldgen && studioEvidence.worldcompile.worldgen.qaRoutes && studioEvidence.worldcompile.worldgen.qaRoutes.length
    ? 84
    : 68;
  const scores = {
    styleFidelity: style.score,
    shapeLanguageFidelity: shape.score,
    materialFidelity: material.score,
    lightingMoodFidelity: lighting.score,
    focalHierarchyFidelity: clampScore((shape.score + layout.score) / 2),
    objectCoverage: objectCoverage.score,
    layoutFidelity: layout.score,
    gameplayAdaptation: gameplay.score,
    mobileAdaptation: clampScore(mobile),
  };
  const weights = {
    styleFidelity: 1.1,
    shapeLanguageFidelity: 1,
    materialFidelity: 1,
    lightingMoodFidelity: 0.9,
    focalHierarchyFidelity: 1.2,
    objectCoverage: 1.2,
    layoutFidelity: 1,
    gameplayAdaptation: 0.8,
    mobileAdaptation: 0.8,
  };
  let total = 0;
  let weightTotal = 0;
  for (const [key, value] of Object.entries(scores)) {
    total += value * weights[key];
    weightTotal += weights[key];
  }
  scores.overall = clampScore(total / weightTotal);
  return {
    scores,
    dimensions: { style, shape, material, lighting, layout, objectCoverage, gameplay },
  };
}

module.exports = { createFidelityScores };
