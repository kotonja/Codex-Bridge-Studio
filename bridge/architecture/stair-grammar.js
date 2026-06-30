'use strict';

const { attachment, folder, model, part, vec3 } = require('./schema');

function createStairGrammar(parsed, style, moduleGrid) {
  return {
    stepCount: 5,
    stepRise: 1,
    landingSize: moduleGrid.bayWidth,
    clearance: moduleGrid.clearance,
    railMarkers: true,
  };
}

function compileStairs(parsed, style, basePath, moduleGrid) {
  const goal = parsed.goal;
  const root = `${basePath}.StairGrammar`;
  const ops = [model(root, 'stairSystem', { goal }), folder(`${root}.Steps`, 'stepModuleFolder', { goal })];
  for (let i = 1; i <= 5; i += 1) {
    ops.push(part(`${root}.Steps.Step${i}`, 'stepModule', { Size: vec3(moduleGrid.clearance + 2, 0.6, 2), Material: 'Slate', Color: style.palette[0], CanCollide: true }, { goal, attributes: { StepIndex: i } }));
  }
  ops.push(
    part(`${root}.Landing`, 'stairLanding', { Size: vec3(moduleGrid.clearance + 4, 0.8, moduleGrid.bayWidth), Material: 'Slate', Color: style.palette[0], CanCollide: true }, { goal }),
    part(`${root}.LeftRailMarker`, 'railMarker', { Size: vec3(0.6, 2.5, moduleGrid.bayWidth), Material: 'Metal', Color: style.palette[2] || style.palette[1] }, { goal }),
    part(`${root}.RightRailMarker`, 'railMarker', { Size: vec3(0.6, 2.5, moduleGrid.bayWidth), Material: 'Metal', Color: style.palette[2] || style.palette[1] }, { goal }),
    attachment(`${root}.Landing.VerticalRouteSocket`, 'verticalRouteLink', { goal }),
  );
  return ops;
}

module.exports = { compileStairs, createStairGrammar };
