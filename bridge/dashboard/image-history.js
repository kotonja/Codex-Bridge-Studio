'use strict';

const { VERSION, nowIso } = require('./schema');
const Store = require('./image-store');
const { privacyReport } = require('./image-privacy');

function history(limit = 25) {
  const references = Store.listRecords(limit);
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    status: 'ready',
    count: references.length,
    references,
    privacy: privacyReport(),
    warnings: [],
    blockers: [],
    nextCommand: references.length
      ? `tools\\bridge.cmd dashboard image-analyze ${references[0].referenceId}`
      : 'tools\\bridge.cmd dashboard image-intake "<local-image-path>"',
  };
}

function get(referenceId) {
  const reference = Store.getRecord(referenceId);
  if (!reference) {
    return {
      ok: false,
      version: VERSION,
      at: nowIso(),
      status: 'notFound',
      referenceId,
      warnings: [],
      blockers: [`No dashboard image reference found for ${referenceId}.`],
      nextCommand: 'tools\\bridge.cmd dashboard image-history',
    };
  }
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    status: 'ready',
    reference,
    privacy: privacyReport(),
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd dashboard image-worldcompile ${reference.referenceId}`,
  };
}

function remove(referenceId) {
  return Store.deleteRecord(referenceId);
}

module.exports = {
  history,
  get,
  remove,
};
