'use strict';

function timingFractions(momentType) {
  if (momentType === 'reward' || momentType === 'uiFeedback') return [0, 0.08, 0.18, 0.3, 0.42, 0.55, 0.66, 0.78, 0.9, 1];
  if (momentType === 'bossIntro' || momentType === 'cutscene') return [0, 0.12, 0.26, 0.44, 0.58, 0.68, 0.76, 0.84, 0.93, 1];
  return [0, 0.1, 0.24, 0.42, 0.5, 0.58, 0.68, 0.78, 0.9, 1];
}

function timeAt(duration, fraction) {
  return Number((duration * fraction).toFixed(2));
}

module.exports = { timeAt, timingFractions };
