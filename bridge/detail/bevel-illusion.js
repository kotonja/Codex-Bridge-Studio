'use strict';

const { vec3 } = require('./schema');
const { trimBand } = require('./trim-grammar');

function bevelFrame(prefix, style, context = {}) {
  const origin = context.origin || vec3(0, 8, 0);
  const width = context.width || 12;
  const height = context.height || 7;
  const z = origin.z ?? 0;
  return [
    trimBand(`${prefix}.TopBevelBand`, 'bevelTop', style, vec3(width, 0.22, 0.3), { ...context, position: vec3(origin.x || 0, (origin.y || 0) + height / 2, z) }),
    trimBand(`${prefix}.BottomBevelBand`, 'bevelBottom', style, vec3(width, 0.22, 0.3), { ...context, position: vec3(origin.x || 0, (origin.y || 0) - height / 2, z) }),
    trimBand(`${prefix}.LeftBevelBand`, 'bevelLeft', style, vec3(0.3, height, 0.3), { ...context, position: vec3((origin.x || 0) - width / 2, origin.y || 0, z) }),
    trimBand(`${prefix}.RightBevelBand`, 'bevelRight', style, vec3(0.3, height, 0.3), { ...context, position: vec3((origin.x || 0) + width / 2, origin.y || 0, z) }),
  ];
}

module.exports = {
  bevelFrame,
};
