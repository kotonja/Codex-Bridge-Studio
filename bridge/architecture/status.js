'use strict';

const { CAPABILITIES, ROOTS, SAFETY, VERSION, nowIso } = require('./schema');

function createStatus() {
  return {
    version: VERSION,
    ok: true,
    at: nowIso(),
    capabilities: CAPABILITIES,
    roots: ROOTS,
    safety: SAFETY,
    warnings: [],
    blockers: [],
    nextCommand: 'tools\\bridge.cmd architecture compile "dark purple anime dungeon gate"',
  };
}

module.exports = { createStatus };
