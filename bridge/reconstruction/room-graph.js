'use strict';

function createRoomGraph(ctx, interiorPlan) {
  const rooms = (interiorPlan.rooms || []).map((room) => ({ ...room }));
  const connections = [
    { id: 'entry_to_hall', from: 'entry_foyer', to: 'primary_hall', type: 'mainPath', width: 16, confidence: 0.75 },
    { id: 'hall_to_shop', from: 'primary_hall', to: 'side_shop', type: 'optionalBranch', width: 10, confidence: 0.58 },
    { id: 'hall_to_quest', from: 'primary_hall', to: 'quest_room', type: 'optionalBranch', width: 10, confidence: 0.55 },
    { id: 'hall_to_reward', from: 'primary_hall', to: 'reward_room', type: 'returnBranch', width: 10, confidence: 0.52 },
  ];
  for (const link of interiorPlan.verticalLinks || []) {
    connections.push({ id: link.id, from: link.from, to: link.to, type: link.type, width: 8, confidence: link.confidence });
  }
  return {
    rooms,
    connections,
    verticalLinks: interiorPlan.verticalLinks || [],
    graphNotes: [
      'Main route stays straight and wide for mobile readability.',
      'Side rooms are optional branches so first-time players keep momentum.',
      'Reward room is positioned for return-loop clarity, not first-objective confusion.',
    ],
  };
}

module.exports = {
  createRoomGraph,
};

