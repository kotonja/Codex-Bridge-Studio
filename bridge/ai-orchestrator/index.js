'use strict';

const { VERSION, nowIso } = require('./schema');
const { getStatus } = require('./status');
const { getConfig } = require('./config');
const { getModelCatalog } = require('./model-catalog');
const { getToolCatalog } = require('./tool-catalog');
const { getFunctionSchemas } = require('./function-schemas');
const { apiPlan, createRun, offlinePlan } = require('./planner');
const { intakeReference } = require('./reference-intake');
const { approveMutation } = require('./approval-gates');
const { costReport } = require('./cost-tracker');
const { getRunReport } = require('./report');
const Store = require('./run-store');

async function getProductionPlan(goal, options = {}) {
  return apiPlan(goal, options);
}

async function runProduction(goal, options = {}) {
  return createRun(goal, options);
}

function continueRun(runId) {
  const run = Store.getRun(runId);
  if (!run) return { ok: false, version: VERSION, status: 'notFound', runId, blockers: [`No AI run found for ${runId}.`], warnings: [], nextCommand: 'tools\\bridge.cmd ai runs' };
  const updated = {
    ...run,
    status: run.blockers && run.blockers.length ? 'manualRequired' : 'waitingApproval',
    updatedAt: nowIso(),
    nextCommand: `tools\\bridge.cmd ai approve ${runId}`,
  };
  Store.saveRun(updated);
  return { ok: true, version: VERSION, at: nowIso(), ...updated };
}

function approveRun(runId) {
  const run = Store.getRun(runId);
  if (!run) return { ok: false, version: VERSION, status: 'notFound', runId, blockers: [`No AI run found for ${runId}.`], warnings: [], nextCommand: 'tools\\bridge.cmd ai runs' };
  const updated = approveMutation(run);
  updated.status = 'waitingApproval';
  Store.saveRun(updated);
  Store.saveReport(runId, { ok: true, version: VERSION, at: nowIso(), ...updated });
  return { ok: true, version: VERSION, at: nowIso(), ...updated };
}

function cancelRun(runId) {
  const run = Store.getRun(runId);
  if (!run) return { ok: false, version: VERSION, status: 'notFound', runId, blockers: [`No AI run found for ${runId}.`], warnings: [], nextCommand: 'tools\\bridge.cmd ai runs' };
  const updated = { ...run, status: 'cancelled', updatedAt: nowIso(), nextCommand: 'tools\\bridge.cmd ai runs' };
  Store.saveRun(updated);
  return { ok: true, version: VERSION, at: nowIso(), ...updated };
}

function listRuns(limit = 50) {
  return Store.listRuns(limit);
}

function getCostReport() {
  const runs = Store.listRuns(500).runs || [];
  return costReport(runs);
}

module.exports = {
  VERSION,
  cancelRun,
  continueRun,
  getConfig,
  getCostReport,
  getFunctionSchemas,
  getModelCatalog,
  getProductionPlan,
  getRunReport,
  getStatus,
  getToolCatalog,
  intakeReference,
  listRuns,
  offlinePlan,
  approveRun,
  runProduction,
};
