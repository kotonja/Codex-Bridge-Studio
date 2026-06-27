'use strict';

function mobileFallback(role) {
  return {
    minPathWidth: role === 'spawn' ? 22 : 16,
    maxSimultaneousVfx: role === 'primaryFocalPoint' || role === 'portal' ? 4 : 2,
    tapTargetReadable: true,
    fallbackActions: ['simplify silhouettes before adding micro detail', 'keep objective labels above 18px equivalent', 'avoid stacked transparent planes'],
  };
}

module.exports = { mobileFallback };
