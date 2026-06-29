'use strict';

const { clampScore } = require('./schema');

function count(value) {
  return Array.isArray(value) ? value.length : 0;
}

function scoreReferenceFidelity(reference, reconstruction) {
  const style = reference && reference.styleProfile ? reference.styleProfile : {};
  const material = reference && reference.materialLanguage ? reference.materialLanguage : {};
  const scene = reference && reference.sceneUnderstanding ? reference.sceneUnderstanding : {};
  const confidence = clampScore((Number(reference && reference.confidence) || 0.55) * 100);
  const subScores = {
    styleMatch: clampScore(62 + count(style.shapeLanguage) * 4 + count(style.colorPalette) * 2),
    shapeLanguageMatch: clampScore(60 + count(style.silhouetteRules) * 5 + count(scene.focalPoints) * 4),
    materialLanguageMatch: clampScore(58 + count(material.likelyMaterials) * 5 + count(material.robloxBuiltInFallbacks || material.robloxBuiltInMaterialFallbacks) * 2),
    focalHierarchyMatch: clampScore(60 + count(scene.focalPoints) * 6),
    impliedStructureMatch: clampScore((Number(reconstruction && reconstruction.overallConfidence) || 0.52) * 100 + 18),
    confidence,
  };
  const values = Object.values(subScores);
  return {
    score: clampScore(values.reduce((sum, value) => sum + value, 0) / values.length),
    subScores,
  };
}

module.exports = { scoreReferenceFidelity };
