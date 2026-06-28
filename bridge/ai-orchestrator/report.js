'use strict';

const { VERSION, nowIso } = require('./schema');
const Store = require('./run-store');

function getRunReport(runId) {
  const report = Store.getReport(runId);
  if (!report) {
    return {
      ok: false,
      version: VERSION,
      at: nowIso(),
      status: 'notFound',
      runId,
      warnings: [],
      blockers: [`No AI run found for ${runId}.`],
      nextCommand: 'tools\\bridge.cmd ai runs',
    };
  }
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    ...report,
    nextCommand: report.nextCommand || `tools\\bridge.cmd ai continue ${runId}`,
  };
}

module.exports = {
  getRunReport,
};
