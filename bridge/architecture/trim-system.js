'use strict';

const { folder, model, part, vec3 } = require('./schema');

function createTrimSystem(parsed, style) {
  return {
    bands: style.trimRules,
    discipline: 'trim follows module bay edges and does not create random noise',
    bevelIllusion: true,
  };
}

function compileTrimSystem(parsed, style, basePath) {
  const goal = parsed.goal;
  const root = `${basePath}.TrimSystem`;
  return [
    model(root, 'trimSystem', { goal }),
    folder(`${root}.Bands`, 'trimBandFolder', { goal }),
    part(`${root}.Bands.PrimaryHorizontalBand`, 'primaryTrimBand', { Size: vec3(32, 0.6, 0.8), Material: 'Metal', Color: style.palette[2] || style.palette[1] }, { goal }),
    part(`${root}.Bands.SecondaryInsetBand`, 'secondaryTrimBand', { Size: vec3(24, 0.35, 0.6), Material: 'Metal', Color: style.palette[1] }, { goal }),
    part(`${root}.Bands.LeftVerticalBevel`, 'bevelIllusion', { Size: vec3(0.6, 16, 0.6), Material: 'Metal', Color: style.palette[2] || style.palette[1] }, { goal }),
    part(`${root}.Bands.RightVerticalBevel`, 'bevelIllusion', { Size: vec3(0.6, 16, 0.6), Material: 'Metal', Color: style.palette[2] || style.palette[1] }, { goal }),
  ];
}

module.exports = { compileTrimSystem, createTrimSystem };
