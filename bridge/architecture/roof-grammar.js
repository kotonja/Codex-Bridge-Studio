'use strict';

const { folder, model, part, vec3 } = require('./schema');

function createRoofGrammar(parsed, style, moduleGrid) {
  return {
    rules: style.roofRules,
    ridgeHeight: moduleGrid.verticalModule * 0.65,
    eaveDepth: moduleGrid.wallThickness * 1.5,
    mobileLowDetailRoof: true,
  };
}

function compileRoofGrammar(parsed, style, basePath, moduleGrid) {
  const goal = parsed.goal;
  const root = `${basePath}.RoofGrammar`;
  return [
    model(root, 'roofSystem', { goal }),
    folder(`${root}.UpperSilhouette`, 'roofUpperSilhouette', { goal }),
    part(`${root}.UpperSilhouette.Ridge`, 'roofRidge', { Size: vec3(30, 2, 4), Material: 'Slate', Color: style.palette[0] }, { goal, budgetCost: 2 }),
    part(`${root}.UpperSilhouette.LeftEave`, 'roofEave', { Size: vec3(32, 1, 2), Material: 'Metal', Color: style.palette[2] || style.palette[1] }, { goal }),
    part(`${root}.UpperSilhouette.RightEave`, 'roofEave', { Size: vec3(32, 1, 2), Material: 'Metal', Color: style.palette[2] || style.palette[1] }, { goal }),
    part(`${root}.UpperSilhouette.BrokenRoofVariant`, 'brokenRoofVariant', { Size: vec3(9, 2, 3), Material: 'Slate', Color: style.palette[0], Transparency: 0.08 }, { goal }),
    part(`${root}.UpperSilhouette.MobileLowDetailRoof`, 'mobileFallbackRoof', { Size: vec3(28, 1, 3), Material: 'Slate', Color: style.palette[0] }, { goal }),
  ];
}

module.exports = { compileRoofGrammar, createRoofGrammar };
