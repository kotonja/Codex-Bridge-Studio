'use strict';

const { confidenceFromEvidence } = require('./confidence');
const { createVerticalityPlan } = require('./verticality-inference');

function createFloorplan(ctx, roomGraph) {
  const evidence = ctx.sourceEvidence;
  const confidence = confidenceFromEvidence(evidence, 0.46, { referenceLabReport: true, noteOnly: !ctx.actualVisionUsed, floorplanFromExterior: true });
  const verticality = createVerticalityPlan(ctx);
  return {
    id: `${ctx.referenceId}_floorplan_v1`,
    levels: [
      {
        level: 1,
        rooms: roomGraph.rooms.map((room) => ({
          id: room.id,
          name: room.name,
          role: room.role,
          approxSize: room.approxSize,
          confidence: room.confidence,
        })),
        connections: roomGraph.connections,
        verticalLinks: verticality.links,
        blockedAreas: [
          { id: 'outer_shell_deadspace', reason: 'Decorative facade mass should not be walkable.', confidence: 0.74 },
          { id: 'portal_core_collision', reason: 'Portal visual volume should use no-collision VFX plus a clear trigger pad.', confidence: 0.69 },
        ],
        spawnCandidates: [
          { id: 'spawn_front_plaza', roomId: 'entry_foyer', reason: 'Spawn faces the front entrance and first objective.', confidence: 0.74 },
        ],
        objectiveCandidates: [
          { id: 'objective_portal_activation', roomId: 'primary_hall', reason: 'Central hero axis makes the main objective readable.', confidence: 0.7 },
          { id: 'objective_quest_npc', roomId: 'quest_room', reason: 'Side quest room gives optional guidance before portal use.', confidence: 0.52 },
        ],
      },
    ],
    confidence,
    assumptions: [
      'No real floorplan was provided; this is inferred from reference language and Roblox hub readability rules.',
      'The first pass favors one main axis with optional branches for clarity.',
    ],
    risks: [
      'Exact room proportions may be wrong without top-down or interior reference.',
      'Back side and upper floor should be treated as variants until more reference is provided.',
    ],
    nextCommand: `tools\\bridge.cmd worldgen graph "${ctx.goal.replace(/"/g, '\\"')}"`,
  };
}

module.exports = {
  createFloorplan,
};

