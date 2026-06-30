'use strict';

const { folder, model, part, vec3 } = require('./schema');

function createWindowDoorGrammar(parsed, style, moduleGrid) {
  return {
    rules: style.windowDoorRules,
    rhythm: ['frame', 'inset', 'trim band', 'blocked decorative alternative'],
    openingClearance: moduleGrid.clearance,
  };
}

function compileWindows(parsed, style, basePath) {
  const goal = parsed.goal;
  const root = `${basePath}.WindowGrammar`;
  return [
    model(root, 'windowSystem', { goal }),
    folder(`${root}.Frames`, 'windowFrameFolder', { goal }),
    part(`${root}.Frames.WindowFrameA`, 'windowFrame', { Size: vec3(5, 7, 0.6), Material: 'Metal', Color: style.palette[2] || style.palette[1] }, { goal }),
    part(`${root}.Frames.WindowInsetA`, 'windowInset', { Size: vec3(3.8, 5.5, 0.4), Material: 'Glass', Color: style.palette[1], Transparency: 0.35 }, { goal }),
    part(`${root}.Frames.BlockedDecorativeWindow`, 'blockedDecorativeWindow', { Size: vec3(5, 6, 0.6), Material: 'Slate', Color: style.palette[0] }, { goal }),
  ];
}

function compileDoors(parsed, style, basePath, moduleGrid) {
  const goal = parsed.goal;
  const root = `${basePath}.DoorGrammar`;
  return [
    model(root, 'doorSystem', { goal }),
    part(`${root}.DoorFrame`, 'doorFrame', { Size: vec3(moduleGrid.clearance + 3, 9, 0.8), Material: 'Metal', Color: style.palette[2] || style.palette[1] }, { goal }),
    part(`${root}.DoorInset`, 'doorInset', { Size: vec3(moduleGrid.clearance, 7.5, 0.6), Material: 'Slate', Color: style.palette[0], Transparency: 0.08 }, { goal }),
    part(`${root}.CollisionOpeningRule`, 'collisionOpeningRule', { Size: vec3(moduleGrid.clearance, 7, 0.5), Material: 'ForceField', Color: style.palette[1], Transparency: 0.95, CanCollide: false }, { goal }),
  ];
}

module.exports = { compileDoors, compileWindows, createWindowDoorGrammar };
