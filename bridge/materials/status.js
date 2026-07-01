'use strict';

const { CAPABILITIES, ROOTS, SAFETY, VERSION, nowIso } = require('./schema');

function createStatus() {
  return {
    version: VERSION,
    ok: true,
    at: nowIso(),
    category: 'materials',
    roots: ROOTS,
    capabilities: CAPABILITIES,
    safety: SAFETY,
    warnings: [],
    blockers: [],
    nextCommand: 'tools\\bridge.cmd materials plan "dark purple anime dungeon gate"',
  };
}

module.exports = {
  createStatus,
};
