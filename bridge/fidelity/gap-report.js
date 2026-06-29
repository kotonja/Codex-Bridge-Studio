'use strict';

const { confidence, quote } = require('./schema');

function severityFromScore(score) {
  if (score < 45) return 'blocker';
  if (score < 60) return 'high';
  if (score < 74) return 'medium';
  return 'low';
}

function mismatch(id, category, score, expected, observed, goal) {
  return {
    id,
    category,
    referenceExpectation: expected && expected.length ? expected.slice(0, 5).join('; ') : `Reference ${category} evidence was sparse.`,
    studioObservation: observed && observed.length ? observed.slice(0, 5).join('; ') : `Studio ${category} evidence was sparse.`,
    severity: severityFromScore(score),
    confidence: confidence(score / 100, 0.55),
    evidence: [
      `score:${score}`,
      expected && expected.length ? 'referenceEvidence:structured' : 'referenceEvidence:limited',
      observed && observed.length ? 'studioEvidence:structured' : 'studioEvidence:limited',
    ],
    whyItMatters: `Reference ${category} mismatch weakens the player's first-read impression.`,
    safeFix: `Create Codex-owned ${category} markers/material notes, then validate through visual critique.`,
    suggestedCommand: `tools\\bridge.cmd fidelity fix-plan ${quote(goal)}`,
    manualRequired: false,
  };
}

function createGapReport(goal, scoreDetails = {}) {
  const dimensions = scoreDetails.dimensions || {};
  const checks = [
    ['style_gap', 'style', dimensions.style],
    ['shape_gap', 'shape', dimensions.shape],
    ['material_gap', 'material', dimensions.material],
    ['lighting_gap', 'lighting', dimensions.lighting],
    ['layout_gap', 'layout', dimensions.layout],
    ['object_gap', 'object', dimensions.objectCoverage],
  ];
  const mismatches = checks
    .filter(([, , item]) => item && item.score < 82)
    .map(([id, category, item]) => mismatch(id, category, item.score, item.expected, item.observed, goal));
  const manual = mismatches
    .filter((item) => item.category === 'material' && item.severity !== 'low')
    .map((item) => ({
      issueId: item.id,
      reason: 'Exact PBR texture/mesh imports may require external asset authoring or marketplace/manual assets.',
      manualRequired: true,
      suggestedCommand: `tools\\bridge.cmd assetforge material-plan ${quote(goal)}`,
    }));
  return {
    mismatches,
    unsafeOrManualRequiredFixes: manual,
  };
}

module.exports = { createGapReport };
