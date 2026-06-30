'use strict';

const { folder, model, part, vec3 } = require('./schema');

function createPillarGrammar(parsed, style) {
  return {
    rules: style.pillarRules,
    pieces: ['base', 'shaft', 'capital', 'brokenVariant', 'socketAttachment'],
  };
}

function compilePillars(parsed, style, basePath) {
  const goal = parsed.goal;
  const root = `${basePath}.PillarGrammar`;
  return [
    model(root, 'pillarSystem', { goal }),
    folder(`${root}.CornerPillars`, 'cornerPillarFolder', { goal }),
    part(`${root}.CornerPillars.LeftBase`, 'pillarBase', { Size: vec3(5, 1.5, 5), Material: 'Slate', Color: style.palette[0], CanCollide: true }, { goal }),
    part(`${root}.CornerPillars.LeftShaft`, 'pillarShaft', { Size: vec3(3, 12, 3), Material: 'Slate', Color: style.palette[0], CanCollide: true }, { goal }),
    part(`${root}.CornerPillars.LeftCapital`, 'pillarCapital', { Size: vec3(5, 1.2, 5), Material: 'Metal', Color: style.palette[2] || style.palette[1] }, { goal }),
    part(`${root}.CornerPillars.RightBase`, 'pillarBase', { Size: vec3(5, 1.5, 5), Material: 'Slate', Color: style.palette[0], CanCollide: true }, { goal }),
    part(`${root}.CornerPillars.RightShaft`, 'pillarShaft', { Size: vec3(3, 12, 3), Material: 'Slate', Color: style.palette[0], CanCollide: true }, { goal }),
    part(`${root}.CornerPillars.RightCapital`, 'pillarCapital', { Size: vec3(5, 1.2, 5), Material: 'Metal', Color: style.palette[2] || style.palette[1] }, { goal }),
    part(`${root}.BrokenPillarVariant`, 'brokenPillarVariant', { Size: vec3(3, 5, 3), Material: 'Slate', Color: style.palette[0], CanCollide: true }, { goal }),
  ];
}

module.exports = { compilePillars, createPillarGrammar };
