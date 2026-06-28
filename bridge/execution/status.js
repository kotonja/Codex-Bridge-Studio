'use strict';

const { CAPABILITIES, ROOTS, SAFETY, VERSION, nowIso } = require('./schema');
const { createRootsReport } = require('./roots');

function createStatus(options = {}) {
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    status: 'ready',
    capabilities: CAPABILITIES,
    safety: SAFETY,
    roots: ROOTS,
    rootReport: options.includeRootReport === false ? undefined : createRootsReport(),
    warnings: [],
    blockers: [],
    nextCommand: 'tools\\bridge.cmd execute preview "premium anime dungeon hub"',
  };
}

module.exports = {
  createStatus,
};
