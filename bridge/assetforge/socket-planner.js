'use strict';

const { SOCKET_TYPES } = require('./schema');

function createSocketPlan(goal, options = {}) {
  const familyId = options.familyId || 'asset_family';
  const sockets = SOCKET_TYPES.map((type, index) => ({
    name: `${type}_${familyId}_${index + 1}`,
    type,
    localPosition: { x: (index % 4) * 1.5 - 2.25, y: 2 + Math.floor(index / 4), z: index % 2 === 0 ? -1.2 : 1.2 },
    localRotation: { x: 0, y: (index % 4) * 90, z: 0 },
    intendedUse: `Expose ${type} to the matching specialist without editing production scripts.`,
    connectedSpecialist: type.includes('VFX') ? 'vfx' : type.includes('Audio') ? 'audio' : type.includes('Animation') ? 'animation' : type.includes('Camera') ? 'camera' : type.includes('Collision') ? 'physics' : 'worldgen',
    validationCheck: `tools\\bridge.cmd assetforge audit "${goal}"`,
  }));
  return {
    ok: true,
    goal,
    familyId,
    sockets,
    socketTypes: SOCKET_TYPES,
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd assetforge generate "${goal}"`,
  };
}

module.exports = { createSocketPlan };
