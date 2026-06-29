'use strict';

const { clampConfidence } = require('./schema');

function confidenceFromEvidence(evidence = [], base = 0.45, modifiers = {}) {
  let score = base;
  const count = Array.isArray(evidence) ? evidence.filter(Boolean).length : 0;
  score += Math.min(0.22, count * 0.035);
  if (modifiers.actualVisionUsed) score += 0.12;
  if (modifiers.referenceLabReport) score += 0.08;
  if (modifiers.noteOnly) score -= 0.04;
  if (modifiers.unseenSide) score -= 0.12;
  if (modifiers.interiorFromExterior) score -= 0.1;
  if (modifiers.floorplanFromExterior) score -= 0.14;
  if (modifiers.userProvidedFloorplan) score += 0.22;
  return clampConfidence(score);
}

function overallConfidence(items = []) {
  const values = items
    .map((item) => Number(item && item.confidence))
    .filter((value) => Number.isFinite(value));
  if (!values.length) return 0;
  return clampConfidence(values.reduce((sum, value) => sum + value, 0) / values.length);
}

module.exports = {
  confidenceFromEvidence,
  overallConfidence,
};

