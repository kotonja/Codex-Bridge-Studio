'use strict';

const { confidenceFromEvidence } = require('./confidence');
const { inferenceItem } = require('./schema');

function createExteriorCompletionPlan(ctx) {
  const evidence = ctx.sourceEvidence;
  const q = ctx.goal.toLowerCase();
  const hasGate = /gate|portal|door|entrance/.test(q);
  const hasDungeon = /dungeon|mansion|castle|temple/.test(q);
  const confidence = confidenceFromEvidence(evidence, hasGate ? 0.6 : 0.52, { referenceLabReport: true, noteOnly: !ctx.actualVisionUsed });
  const facadeDepth = hasDungeon ? 18 : 12;
  const modules = [
    {
      id: 'front_facade_shell',
      type: 'facade',
      purpose: 'Preserve visible hero silhouette and readable entrance hierarchy.',
      approxSize: { x: 76, y: 44, z: facadeDepth },
      assetNeeds: ['modular wall slabs', 'trim bands', 'corner columns', 'hero signage/socket'],
      confidence,
    },
    {
      id: 'side_wall_pair',
      type: 'sideWall',
      purpose: 'Extend the reference sideways enough to support interior depth and prevent paper-thin facade feel.',
      approxSize: { x: facadeDepth, y: 34, z: 64 },
      assetNeeds: ['repeatable side wall panels', 'window variants', 'buttress/pipe detail'],
      confidence: confidenceFromEvidence(evidence, 0.53, { unseenSide: true, noteOnly: !ctx.actualVisionUsed }),
    },
    {
      id: 'roof_cap',
      type: 'roof',
      purpose: 'Hide interior shell seams, create premium silhouette, and provide VFX/camera anchor points.',
      approxSize: { x: 78, y: 10, z: 72 },
      assetNeeds: ['roof cap mesh/part stack', 'edge trim', 'glow sockets'],
      confidence: confidenceFromEvidence(evidence, 0.5, { unseenSide: true, noteOnly: !ctx.actualVisionUsed }),
    },
  ];
  return {
    summary: 'Complete the visible exterior as a modular shell with enough side depth to justify playable rooms.',
    modules,
    openings: [
      { id: 'front_door', type: 'doorway', connectsTo: 'entry_foyer', width: hasGate ? 18 : 12, height: hasGate ? 22 : 14, confidence },
      { id: 'side_windows', type: 'window', connectsTo: 'primary_hall', count: 4, confidence: confidenceFromEvidence(evidence, 0.45, { unseenSide: true }) },
    ],
    inferences: [
      inferenceItem('exterior.side_depth', 'Give the structure real side-wall depth instead of a flat facade.', 'Playable interiors and camera angles need believable mass behind the visible reference.', 0.56, {
        sourceEvidence: evidence,
        alternatives: ['open-air portal arch', 'thin facade with teleport trigger only'],
      }),
      inferenceItem('exterior.roof_cap', 'Use a roof cap/upper silhouette to conceal interior seams.', 'Premium Roblox hubs read better when the structure has a clean top silhouette from spawn and side angles.', 0.5, {
        sourceEvidence: evidence,
        alternatives: ['floating trim ring', 'open courtyard roofless design'],
      }),
    ],
    confidence,
  };
}

module.exports = {
  createExteriorCompletionPlan,
};

