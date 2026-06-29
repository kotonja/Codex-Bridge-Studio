'use strict';

const path = require('node:path');

const ROOT = path.resolve(process.cwd(), '.codex-studio', 'reference-intake-v86');
const TEMP_DIR = path.join(ROOT, 'temp');
const METADATA_DIR = path.join(ROOT, 'metadata');
const ANALYSIS_DIR = path.join(ROOT, 'analysis');
const PACKAGE_DIR = path.join(ROOT, 'packages');
const INDEX_PATH = path.join(ROOT, 'index.json');
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp']);
const RAW_BYTES_PATTERN = /\b(?:data:image\/|base64,|[A-Za-z0-9+/]{180,}={0,2})/;

function normalizeExtension(value = '') {
  return path.extname(String(value || '')).toLowerCase();
}

function isAllowedExtension(value = '') {
  return ALLOWED_EXTENSIONS.has(normalizeExtension(value));
}

function ensureInsideRoot(targetPath) {
  const resolved = path.resolve(targetPath || ROOT);
  const relative = path.relative(ROOT, resolved);
  if (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))) return resolved;
  throw new Error(`Unsafe dashboard image path outside V86 store: ${targetPath}`);
}

function toStoreRelative(targetPath) {
  const resolved = ensureInsideRoot(targetPath);
  return path.relative(process.cwd(), resolved).replace(/\\/g, '/');
}

function fromStoreRelative(storedPath = '') {
  const resolved = path.resolve(process.cwd(), storedPath);
  return ensureInsideRoot(resolved);
}

function assertNoRawImageBytes(value, label = 'value') {
  const text = typeof value === 'string' ? value : JSON.stringify(value || {});
  if (RAW_BYTES_PATTERN.test(text)) {
    throw new Error(`Raw image bytes/base64-like payload detected in ${label}`);
  }
}

function publicRecord(record = {}) {
  const copy = { ...record };
  delete copy._absolutePath;
  delete copy.absolutePath;
  delete copy.fileBuffer;
  delete copy.buffer;
  delete copy.rawBytes;
  delete copy.base64;
  return copy;
}

function privacyReport(extra = {}) {
  return {
    localOnly: true,
    rawBytesStoredInMemory: false,
    rawBytesStoredInReports: false,
    maxImageBytes: MAX_IMAGE_BYTES,
    allowedExtensions: Array.from(ALLOWED_EXTENSIONS),
    apiKeyInFrontend: false,
    ...extra,
  };
}

module.exports = {
  ROOT,
  TEMP_DIR,
  METADATA_DIR,
  ANALYSIS_DIR,
  PACKAGE_DIR,
  INDEX_PATH,
  MAX_IMAGE_BYTES,
  ALLOWED_EXTENSIONS,
  normalizeExtension,
  isAllowedExtension,
  ensureInsideRoot,
  toStoreRelative,
  fromStoreRelative,
  assertNoRawImageBytes,
  publicRecord,
  privacyReport,
};
