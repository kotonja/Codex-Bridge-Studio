'use strict';

const { vec3 } = require('./schema');

function portalShape(scale = 'medium') {
  const multiplier = scale === 'large' ? 1.35 : scale === 'small' ? 0.7 : 1;
  return {
    width: 18 * multiplier,
    height: 22 * multiplier,
    depth: 5 * multiplier,
    plinth: vec3(24 * multiplier, 2.2 * multiplier, 9 * multiplier),
    pillar: vec3(3.2 * multiplier, 18 * multiplier, 4.5 * multiplier),
    keystone: vec3(19 * multiplier, 4.2 * multiplier, 5 * multiplier),
    glow: vec3(12 * multiplier, 16 * multiplier, 0.45 * multiplier),
  };
}

function pathShape(scale = 'medium') {
  const multiplier = scale === 'large' ? 1.4 : scale === 'small' ? 0.7 : 1;
  return {
    slab: vec3(8 * multiplier, 0.35, 6 * multiplier),
    edge: vec3(8 * multiplier, 0.4, 0.35),
    marker: vec3(2.2 * multiplier, 0.2, 2.2 * multiplier),
  };
}

function buildingShape(scale = 'medium') {
  const multiplier = scale === 'large' ? 1.3 : scale === 'small' ? 0.75 : 1;
  return {
    base: vec3(18 * multiplier, 2, 12 * multiplier),
    wall: vec3(18 * multiplier, 10 * multiplier, 1),
    column: vec3(1.5 * multiplier, 11 * multiplier, 1.5 * multiplier),
    roof: vec3(20 * multiplier, 2.5 * multiplier, 13 * multiplier),
    sign: vec3(10 * multiplier, 2.2 * multiplier, 0.35),
  };
}

module.exports = {
  buildingShape,
  pathShape,
  portalShape,
};
