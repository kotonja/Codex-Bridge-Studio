'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { getApiKeyInfo } = require('../ai-orchestrator/secret-policy');
const { getImageMetadata } = require('../reference-lab/image-metadata');
const { VERSION, nowIso, safeText } = require('./schema');
const Store = require('./image-store');
const {
  TEMP_DIR,
  MAX_IMAGE_BYTES,
  normalizeExtension,
  isAllowedExtension,
  toStoreRelative,
  privacyReport,
  publicRecord,
} = require('./image-privacy');

function sha256Buffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function makeReferenceId(hash) {
  return `dash_img_${String(hash || crypto.randomUUID()).replace(/[^a-f0-9]/gi, '').slice(0, 16)}`;
}

function unavailable(input, blockers, warnings = []) {
  const keyInfo = getApiKeyInfo();
  return {
    ok: false,
    version: VERSION,
    status: 'unavailable',
    available: false,
    referenceId: null,
    imagePath: safeText(input),
    apiConfigured: Boolean(keyInfo.configured),
    actualVisionUsed: false,
    mode: 'unavailable',
    privacy: privacyReport(),
    warnings,
    blockers,
    nextCommand: 'tools\\bridge.cmd dashboard image-intake "<local-image-path>"',
  };
}

function copyPathToStore(imagePath, options = {}) {
  const sourcePath = path.resolve(String(imagePath || ''));
  if (!imagePath || !fs.existsSync(sourcePath)) {
    return unavailable(imagePath, ['Image path is missing or unreadable.']);
  }
  const stat = fs.statSync(sourcePath);
  if (!stat.isFile()) return unavailable(imagePath, ['Image path exists but is not a file.']);
  const extension = normalizeExtension(sourcePath);
  if (!isAllowedExtension(sourcePath)) return unavailable(imagePath, ['File extension must be png, jpg, jpeg, webp, gif, or bmp.']);
  const maxBytes = options.maxBytes || MAX_IMAGE_BYTES;
  if (stat.size > maxBytes) return unavailable(imagePath, [`Image is too large (${stat.size} bytes). V86 dashboard intake limit is ${maxBytes} bytes.`]);
  const buffer = fs.readFileSync(sourcePath);
  return writeBufferToStore(buffer, path.basename(sourcePath), { ...options, sourcePath });
}

function writeBufferToStore(buffer, originalName = 'upload.png', options = {}) {
  const bytes = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer || []);
  const extension = normalizeExtension(originalName);
  const maxBytes = options.maxBytes || MAX_IMAGE_BYTES;
  if (!bytes.length) return unavailable(originalName, ['Uploaded image was empty.']);
  if (!isAllowedExtension(originalName)) return unavailable(originalName, ['File extension must be png, jpg, jpeg, webp, gif, or bmp.']);
  if (bytes.length > maxBytes) return unavailable(originalName, [`Image is too large (${bytes.length} bytes). V86 dashboard intake limit is ${maxBytes} bytes.`]);

  Store.ensureStore();
  const sha256 = sha256Buffer(bytes);
  const referenceId = makeReferenceId(sha256);
  const storedAbsolutePath = path.join(TEMP_DIR, `${referenceId}${extension}`);
  fs.writeFileSync(storedAbsolutePath, bytes);
  const metadata = getImageMetadata(storedAbsolutePath, { includeAbsolutePath: true });
  const keyInfo = getApiKeyInfo();
  const warnings = [...(metadata.warnings || [])];
  if (!keyInfo.configured) warnings.push('OPENAI_API_KEY is not configured; dashboard image analysis will be metadata-only.');
  const record = publicRecord({
    version: VERSION,
    referenceId,
    originalName: path.basename(originalName),
    storedPath: toStoreRelative(storedAbsolutePath),
    temporary: true,
    extension,
    byteSize: bytes.length,
    sha256,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    sourcePathHash: options.sourcePath ? crypto.createHash('sha256').update(path.resolve(options.sourcePath)).digest('hex').slice(0, 16) : null,
    imageMetadata: {
      ...metadata,
      _absolutePath: undefined,
    },
    apiConfigured: Boolean(keyInfo.configured),
    actualVisionUsed: false,
    mode: 'metadataOnly',
    analysisSummary: {
      status: 'notAnalyzed',
      summary: 'Image has been copied into the local V86 dashboard reference intake store. No vision analysis has run yet.',
    },
    worldcompilePackageId: null,
    privacy: privacyReport(),
    warnings,
    blockers: metadata.blockers || [],
    nextCommand: `tools\\bridge.cmd dashboard image-analyze ${referenceId}`,
  });
  Store.upsertRecord(record);
  return {
    ok: true,
    version: VERSION,
    status: 'intaked',
    available: true,
    reference: record,
    referenceId,
    apiConfigured: record.apiConfigured,
    actualVisionUsed: false,
    mode: 'metadataOnly',
    privacy: privacyReport(),
    warnings,
    blockers: [],
    nextCommand: record.nextCommand,
  };
}

function intake(input = {}, options = {}) {
  if (Buffer.isBuffer(input.buffer)) {
    return writeBufferToStore(input.buffer, input.originalName || input.fileName || 'upload.png', options);
  }
  const imagePath = typeof input === 'string' ? input : (input.imagePath || input.path || input.source || '');
  return copyPathToStore(imagePath, options);
}

module.exports = {
  intake,
  copyPathToStore,
  writeBufferToStore,
  makeReferenceId,
};
