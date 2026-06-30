'use strict';

const { vec3 } = require('./schema');
const { trimBand } = require('./trim-grammar');

function bevelFrame(prefix, style, context = {}) {
  return [
    trimBand(`${prefix}.TopBevelBand`, 'bevelTop', style, vec3(12, 0.22, 0.3), context),
    trimBand(`${prefix}.BottomBevelBand`, 'bevelBottom', style, vec3(12, 0.22, 0.3), context),
    trimBand(`${prefix}.LeftBevelBand`, 'bevelLeft', style, vec3(0.3, 7, 0.3), context),
    trimBand(`${prefix}.RightBevelBand`, 'bevelRight', style, vec3(0.3, 7, 0.3), context),
  ];
}

module.exports = {
  bevelFrame,
};
