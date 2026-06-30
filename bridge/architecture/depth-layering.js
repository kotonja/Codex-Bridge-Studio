'use strict';

const { model, part, vec3 } = require('./schema');

function createDepthLayeringPlan(parsed, style) {
  return {
    levels: ['base silhouette', 'trim/depth layer', 'accent/socket layer'],
    rule: 'each layer must read at a different scale and avoid flat billboard-only construction',
  };
}

function compileDepthLayering(parsed, style, basePath) {
  const goal = parsed.goal;
  const root = `${basePath}.DepthLayering`;
  return [
    model(root, 'depthLayeringSystem', { goal }),
    part(`${root}.BaseSilhouetteBlock`, 'baseSilhouetteLayer', { Size: vec3(30, 18, 2), Material: 'Slate', Color: style.palette[0], Transparency: 0.08 }, { goal }),
    part(`${root}.TrimDepthOffset`, 'trimDepthLayer', { Size: vec3(28, 16, 0.7), Material: 'Metal', Color: style.palette[2] || style.palette[1], Transparency: 0.04 }, { goal }),
    part(`${root}.AccentSocketLayer`, 'accentSocketLayer', { Size: vec3(20, 12, 0.45), Material: 'Neon', Color: style.palette[1], Transparency: 0.4 }, { goal }),
  ];
}

module.exports = { compileDepthLayering, createDepthLayeringPlan };
