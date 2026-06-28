'use strict';

const { VERSION, nowIso } = require('./schema');

function baseContract(kind, extra = {}) {
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    kind,
    warnings: [],
    blockers: [],
    nextCommand: 'tools\\bridge.cmd ai status',
    ...extra,
  };
}

module.exports = {
  baseContract,
};
