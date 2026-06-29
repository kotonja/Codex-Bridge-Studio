'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  ROOT,
  TEMP_DIR,
  METADATA_DIR,
  ANALYSIS_DIR,
  PACKAGE_DIR,
  INDEX_PATH,
  ensureInsideRoot,
  fromStoreRelative,
  publicRecord,
  assertNoRawImageBytes,
} = require('./image-privacy');
const { VERSION, nowIso, redact } = require('./schema');

function ensureStore() {
  for (const dir of [ROOT, TEMP_DIR, METADATA_DIR, ANALYSIS_DIR, PACKAGE_DIR]) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(INDEX_PATH)) {
    fs.writeFileSync(INDEX_PATH, JSON.stringify({ version: VERSION, updatedAt: nowIso(), references: [] }, null, 2));
  }
}

function readIndex() {
  ensureStore();
  try {
    const parsed = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
    return {
      version: parsed.version || VERSION,
      updatedAt: parsed.updatedAt || null,
      references: Array.isArray(parsed.references) ? parsed.references : [],
    };
  } catch {
    return { version: VERSION, updatedAt: nowIso(), references: [] };
  }
}

function writeIndex(index) {
  ensureStore();
  const safe = {
    version: VERSION,
    updatedAt: nowIso(),
    references: Array.isArray(index.references) ? index.references.map(publicRecord) : [],
  };
  assertNoRawImageBytes(safe, 'dashboard image index');
  fs.writeFileSync(INDEX_PATH, JSON.stringify(safe, null, 2), 'utf8');
  return safe;
}

function metadataPath(referenceId) {
  return ensureInsideRoot(path.join(METADATA_DIR, `${referenceId}.json`));
}

function analysisPath(referenceId) {
  return ensureInsideRoot(path.join(ANALYSIS_DIR, `${referenceId}.json`));
}

function packagePath(referenceId) {
  return ensureInsideRoot(path.join(PACKAGE_DIR, `${referenceId}.json`));
}

function writeJson(filePath, payload) {
  ensureStore();
  assertNoRawImageBytes(payload, filePath);
  fs.writeFileSync(ensureInsideRoot(filePath), JSON.stringify(redact(payload), null, 2), 'utf8');
}

function readJson(filePath) {
  try {
    const resolved = ensureInsideRoot(filePath);
    if (!fs.existsSync(resolved)) return null;
    return JSON.parse(fs.readFileSync(resolved, 'utf8'));
  } catch {
    return null;
  }
}

function upsertRecord(record = {}) {
  ensureStore();
  const clean = publicRecord({ ...record, version: VERSION, updatedAt: nowIso() });
  const index = readIndex();
  const existing = index.references.findIndex((item) => item.referenceId === clean.referenceId);
  if (existing >= 0) index.references[existing] = { ...index.references[existing], ...clean };
  else index.references.unshift(clean);
  index.references = index.references.slice(0, 100);
  writeIndex(index);
  writeJson(metadataPath(clean.referenceId), clean);
  return clean;
}

function getRecord(referenceId) {
  const id = String(referenceId || '').trim();
  if (!id) return null;
  const index = readIndex();
  const found = index.references.find((item) => item.referenceId === id);
  if (!found) return null;
  return publicRecord(found);
}

function resolveStoredPath(record = {}) {
  if (!record.storedPath) return null;
  return fromStoreRelative(record.storedPath);
}

function listRecords(limit = 25) {
  const index = readIndex();
  return index.references.slice(0, Math.max(1, Math.min(Number(limit) || 25, 100))).map(publicRecord);
}

function deleteRecord(referenceId) {
  ensureStore();
  const record = getRecord(referenceId);
  if (!record) {
    return { ok: false, version: VERSION, status: 'notFound', referenceId, warnings: [], blockers: [`No dashboard image reference found for ${referenceId}.`] };
  }
  const deleted = [];
  const skipped = [];
  for (const filePath of [record.storedPath ? resolveStoredPath(record) : null, metadataPath(record.referenceId), analysisPath(record.referenceId), packagePath(record.referenceId)]) {
    if (!filePath) continue;
    try {
      const safePath = ensureInsideRoot(filePath);
      if (fs.existsSync(safePath)) {
        fs.unlinkSync(safePath);
        deleted.push(path.relative(process.cwd(), safePath).replace(/\\/g, '/'));
      }
    } catch (error) {
      skipped.push(`${filePath}: ${error.message}`);
    }
  }
  const index = readIndex();
  index.references = index.references.filter((item) => item.referenceId !== record.referenceId);
  writeIndex(index);
  return {
    ok: true,
    version: VERSION,
    status: 'deleted',
    referenceId: record.referenceId,
    deleted,
    skipped,
    warnings: skipped,
    blockers: [],
    nextCommand: 'tools\\bridge.cmd dashboard image-history',
  };
}

module.exports = {
  ensureStore,
  readIndex,
  writeIndex,
  metadataPath,
  analysisPath,
  packagePath,
  writeJson,
  readJson,
  upsertRecord,
  getRecord,
  resolveStoredPath,
  listRecords,
  deleteRecord,
};
