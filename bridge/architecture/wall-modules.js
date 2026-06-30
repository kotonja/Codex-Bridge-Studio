'use strict';

const { color, folder, model, part, vec3 } = require('./schema');

const BAY_TYPES = ['StraightBay', 'CornerBay', 'DoorwayBay', 'WindowBay', 'BrokenBay', 'HalfHeightBarrier', 'DecorativeBlockedBay', 'CollisionProxyBay'];

function createWallModulePlan(parsed, style, moduleGrid) {
  return {
    bayTypes: BAY_TYPES,
    bayWidth: moduleGrid.bayWidth,
    wallThickness: moduleGrid.wallThickness,
    rhythm: ['solid', 'window', 'solid', 'door', 'broken accent'],
    rules: style.wallRules,
  };
}

function compileWallModules(parsed, style, basePath, moduleGrid) {
  const goal = parsed.goal;
  const root = `${basePath}.WallModules`;
  const ops = [model(root, 'wallModuleSystem', { goal }), folder(`${root}.Bays`, 'wallBayFolder', { goal })];
  BAY_TYPES.forEach((bay, index) => {
    const isProxy = bay === 'CollisionProxyBay';
    ops.push(part(`${root}.Bays.${bay}`, 'wallBay', {
      Size: isProxy ? vec3(moduleGrid.bayWidth, moduleGrid.verticalModule, moduleGrid.wallThickness) : vec3(moduleGrid.bayWidth, moduleGrid.verticalModule + (index % 2), moduleGrid.wallThickness),
      Material: isProxy ? 'ForceField' : 'Slate',
      Color: isProxy ? color(0.1, 1, 1) : style.palette[index % style.palette.length],
      Transparency: isProxy ? 0.94 : bay.includes('Broken') ? 0.08 : 0,
      CanCollide: isProxy || bay.includes('Barrier'),
    }, { goal, attributes: { WallBayType: bay }, budgetCost: isProxy ? 1 : 2 }));
  });
  return ops;
}

module.exports = { BAY_TYPES, compileWallModules, createWallModulePlan };
