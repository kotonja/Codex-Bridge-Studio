'use strict';

const { color, vec3 } = require('./schema');
const { part } = require('./part-grammar');

function trimBand(path, role, style, size, context = {}) {
  const tint = (style.palette && style.palette[2]) || color(0.95, 0.72, 0.22);
  return part(path, role || 'trimBand', {
    Material: 'Metal',
    Color: tint,
    Size: size || vec3(8, 0.35, 0.35),
    ...(context.position ? { Position: context.position } : {}),
    Transparency: 0,
  }, { ...context, budgetCost: 1 });
}

function runeInset(path, role, style, size, context = {}) {
  const tint = (style.palette && style.palette[1]) || color(0.55, 0.12, 1);
  return part(path, role || 'runeInset', {
    Material: 'Neon',
    Color: tint,
    Size: size || vec3(2, 0.12, 0.2),
    ...(context.position ? { Position: context.position } : {}),
    Transparency: 0.08,
  }, { ...context, budgetCost: 1 });
}

function rivet(path, role, style, context = {}) {
  const tint = (style.palette && style.palette[2]) || color(0.9, 0.7, 0.25);
  return part(path, role || 'rivet', {
    Material: 'Metal',
    Color: tint,
    Size: vec3(0.45, 0.45, 0.18),
    ...(context.position ? { Position: context.position } : {}),
    Transparency: 0,
  }, { ...context, budgetCost: 0.5 });
}

module.exports = {
  rivet,
  runeInset,
  trimBand,
};
