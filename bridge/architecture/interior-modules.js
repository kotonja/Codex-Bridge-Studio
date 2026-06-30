'use strict';

const { attachment, folder, model, part, vec3 } = require('./schema');

function createInteriorModulePlan(parsed, style, moduleGrid) {
  return {
    roomShell: { width: moduleGrid.bayWidth * 2, depth: moduleGrid.bayWidth * 2, height: moduleGrid.verticalModule * 2 },
    doorwayConnectors: ['front', 'left optional', 'right optional'],
    roles: ['spawn vestibule', 'shop alcove', 'boss preview room', 'reward chest pocket'],
    clearance: moduleGrid.clearance,
  };
}

function compileInteriorModules(parsed, style, basePath, moduleGrid) {
  const goal = parsed.goal;
  const root = `${basePath}.InteriorModules`;
  return [
    model(root, 'interiorModuleSystem', { goal }),
    folder(`${root}.RoomShell`, 'roomShellFolder', { goal }),
    part(`${root}.RoomShell.FloorGrid`, 'floorGrid', { Size: vec3(moduleGrid.bayWidth * 2, 0.4, moduleGrid.bayWidth * 2), Material: 'Slate', Color: style.palette[0], CanCollide: true }, { goal }),
    part(`${root}.RoomShell.LeftWall`, 'roomWall', { Size: vec3(1, moduleGrid.verticalModule * 2, moduleGrid.bayWidth * 2), Material: 'Slate', Color: style.palette[0], CanCollide: true }, { goal }),
    part(`${root}.RoomShell.RightWall`, 'roomWall', { Size: vec3(1, moduleGrid.verticalModule * 2, moduleGrid.bayWidth * 2), Material: 'Slate', Color: style.palette[0], CanCollide: true }, { goal }),
    part(`${root}.RoomShell.CeilingBeamA`, 'ceilingBeam', { Size: vec3(moduleGrid.bayWidth * 2, 0.8, 0.8), Material: 'Wood', Color: style.palette[2] || style.palette[1] }, { goal }),
    part(`${root}.DoorwayConnector`, 'doorwayConnector', { Size: vec3(moduleGrid.clearance, 8, 0.6), Material: 'ForceField', Color: style.palette[1], Transparency: 0.95, CanCollide: false }, { goal }),
    attachment(`${root}.RoomRoleMarker`, 'roomRoleMarker', { goal, attributes: { RoomRole: 'bossPreviewShopQuestReward' } }),
  ];
}

module.exports = { compileInteriorModules, createInteriorModulePlan };
