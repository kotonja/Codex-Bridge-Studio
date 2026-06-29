'use strict';

const { confidenceFromEvidence } = require('./confidence');
const { inferenceItem } = require('./schema');

function createBacksidePlan(ctx) {
  const evidence = ctx.sourceEvidence;
  const q = ctx.goal.toLowerCase();
  const hasPortal = /portal|gate|rift/.test(q);
  const confidence = confidenceFromEvidence(evidence, 0.43, { referenceLabReport: true, noteOnly: !ctx.actualVisionUsed, unseenSide: true });
  const alternatives = [
    {
      id: 'service_back',
      description: 'Functional service back with small maintenance door, pipes, vents, and low-detail silhouette.',
      tradeoff: 'Most believable for a production building, least magical.',
      confidence: confidenceFromEvidence(evidence, 0.48, { unseenSide: true }),
    },
    {
      id: 'portal_energy_back',
      description: 'Back side exposes glowing conduits, rune panels, and portal containment hardware.',
      tradeoff: 'More premium for magical/anime gates, but less faithful if reference is realistic.',
      confidence: hasPortal ? 0.58 : 0.38,
    },
    {
      id: 'blocked_decor_back',
      description: 'Back remains decorative and inaccessible, with collision blocking and vista-only detail.',
      tradeoff: 'Safest when no rear reference exists, but limits gameplay exploration.',
      confidence: 0.62,
    },
  ];
  return {
    summary: 'Backside cannot be claimed as known; provide safe variants with explicit tradeoffs.',
    preferredVariant: hasPortal ? 'portal_energy_back' : 'blocked_decor_back',
    alternatives,
    inferences: [
      inferenceItem('backside.unseen', 'Back side is inferred, not observed.', 'Reference evidence does not prove the rear shape; variants are safer than one forced answer.', confidence, {
        sourceEvidence: evidence,
        risk: 'high',
        alternatives: alternatives.map((item) => item.id),
        needsUserReference: confidence < 0.5,
      }),
      inferenceItem('backside.access_control', 'Keep rear access blocked unless gameplay specifically needs it.', 'Unseen backs often create QA issues when players can reach unfinished geometry.', 0.64, {
        sourceEvidence: evidence,
        alternatives: ['secret rear route', 'service hallway loop'],
      }),
    ],
    confidence,
  };
}

module.exports = {
  createBacksidePlan,
};

