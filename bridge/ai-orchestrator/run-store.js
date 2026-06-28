'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { DIRS, STORE_ROOT, VERSION, nowIso } = require('./schema');
const { redact } = require('./secret-policy');

const INDEX = path.join(STORE_ROOT, 'index.json');

function ensureStore() {
  fs.mkdirSync(STORE_ROOT, { recursive: true });
  for (const dir of Object.values(DIRS)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(INDEX)) fs.writeFileSync(INDEX, JSON.stringify({ version: VERSION, updatedAt: nowIso(), runs: [] }, null, 2) + '\n', 'utf8');
}

function readJson(file, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  ensureStore();
  fs.writeFileSync(file, JSON.stringify(redact(value), null, 2) + '\n', 'utf8');
  return file;
}

function runPath(runId) {
  return path.join(DIRS.runs, `${runId}.json`);
}

function reportPath(runId) {
  return path.join(DIRS.reports, `${runId}.json`);
}

function referencePath(referenceId) {
  return path.join(DIRS.references, `${referenceId}.json`);
}

function updateIndex(run) {
  ensureStore();
  const index = readJson(INDEX, { version: VERSION, runs: [] });
  const runs = Array.isArray(index.runs) ? index.runs : [];
  const compact = {
    runId: run.runId,
    goal: run.goal,
    status: run.status,
    model: run.model,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    nextCommand: run.nextCommand,
  };
  const existing = runs.findIndex((item) => item.runId === run.runId);
  if (existing >= 0) runs[existing] = compact;
  else runs.unshift(compact);
  while (runs.length > 200) runs.pop();
  writeJson(INDEX, { version: VERSION, updatedAt: nowIso(), runs });
}

function saveRun(run) {
  writeJson(runPath(run.runId), run);
  updateIndex(run);
  return run;
}

function getRun(runId) {
  ensureStore();
  return readJson(runPath(runId));
}

function listRuns(limit = 50) {
  ensureStore();
  const index = readJson(INDEX, { version: VERSION, runs: [] });
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    count: Array.isArray(index.runs) ? index.runs.length : 0,
    runs: Array.isArray(index.runs) ? index.runs.slice(0, limit) : [],
    nextCommand: 'tools\\bridge.cmd ai report <runId>',
  };
}

function saveReport(runId, report) {
  writeJson(reportPath(runId), report);
  return report;
}

function getReport(runId) {
  ensureStore();
  return readJson(reportPath(runId)) || getRun(runId);
}

function saveReference(reference) {
  writeJson(referencePath(reference.referenceId), reference);
  return reference;
}

module.exports = {
  DIRS,
  INDEX,
  STORE_ROOT,
  ensureStore,
  getReport,
  getRun,
  listRuns,
  readJson,
  referencePath,
  reportPath,
  runPath,
  saveReference,
  saveReport,
  saveRun,
  writeJson,
};
