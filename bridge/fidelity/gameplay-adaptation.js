'use strict';

const { arr, clampScore } = require('./schema');

function createGameplayAdaptation(referenceEvidence = {}, studioEvidence = {}) {
  const ref = referenceEvidence.evidence || {};
  const gameplay = ref.gameplayInterpretation || {};
  const scene = ref.sceneUnderstanding || {};
  const graph = studioEvidence.worldcompile && studioEvidence.worldcompile.worldgen || {};
  const adaptations = [];
  if ((graph.paths || []).length) {
    adaptations.push({
      id: 'mobile_path_width',
      type: 'intentionalPlayableAdaptation',
      referenceExpectation: arr(scene.walkableAreasHypothesis)[0] || 'Reference walkway proportions may be stylized or cramped.',
      studioObservation: 'Worldgen includes explicit QA routes and path markers for readable traversal.',
      reason: 'Roblox hubs need wider readable paths for mobile and multiplayer flow.',
      confidence: 0.78,
    });
  }
  if ((graph.sockets || []).length) {
    adaptations.push({
      id: 'gameplay_sockets',
      type: 'intentionalPlayableAdaptation',
      referenceExpectation: arr(gameplay.interactionPoints)[0] || 'Reference shows visual POIs but not implementation sockets.',
      studioObservation: 'Studio package includes VFX/audio/camera/gameplay sockets.',
      reason: 'Playable Roblox scenes need clear interactive hooks beyond static visual fidelity.',
      confidence: 0.74,
    });
  }
  const score = clampScore(70 + adaptations.length * 8);
  return {
    score,
    adaptations,
    warnings: adaptations.length ? [] : ['No intentional gameplay adaptations were detected from structured evidence.'],
  };
}

module.exports = { createGameplayAdaptation };
