'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { DIRS, nowIso, stableReferenceId } = require('./schema');
const { redact } = require('../ai-orchestrator/secret-policy');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(file, value) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${JSON.stringify(redact(value), null, 2)}\n`, 'utf8');
}

function readJson(file, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function ensureStore() {
  for (const dir of Object.values(DIRS)) ensureDir(dir);
  return DIRS;
}

function storeIntake(report) {
  ensureStore();
  const id = report.referenceId || stableReferenceId(report.input || report.source || 'reference');
  const file = path.join(DIRS.intake, `${id}.json`);
  writeJson(file, { ...report, storedAt: nowIso() });
  return { file, relativeFile: path.relative(process.cwd(), file).replace(/\\/g, '/') };
}

function storeManifest(manifest) {
  ensureStore();
  const id = manifest.referenceId || stableReferenceId(manifest.goal || 'reference-manifest');
  const file = path.join(DIRS.manifests, `${id}.json`);
  writeJson(file, { ...manifest, storedAt: nowIso() });
  return { file, relativeFile: path.relative(process.cwd(), file).replace(/\\/g, '/') };
}

function listIntakes(limit = 25) {
  ensureStore();
  return fs.readdirSync(DIRS.intake)
    .filter((name) => name.endsWith('.json'))
    .map((name) => readJson(path.join(DIRS.intake, name), null))
    .filter(Boolean)
    .sort((a, b) => String(b.storedAt || b.at).localeCompare(String(a.storedAt || a.at)))
    .slice(0, limit);
}

module.exports = {
  ensureStore,
  listIntakes,
  readJson,
  storeIntake,
  storeManifest,
  writeJson,
};
