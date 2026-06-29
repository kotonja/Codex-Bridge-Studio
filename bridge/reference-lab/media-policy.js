'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { IMAGE_EXTENSIONS, TEXT_EXTENSIONS, safeText } = require('./schema');

function classifySource(input = '') {
  const raw = safeText(input);
  if (!raw) {
    return {
      input: raw,
      mode: 'unavailable',
      available: false,
      sourceKind: 'unknown',
      metadata: { exists: false, extension: null, fileCount: 0, byteSize: null },
      warnings: [],
      blockers: ['No reference path or note was provided.'],
    };
  }

  const resolved = path.resolve(raw);
  const exists = fs.existsSync(raw) || fs.existsSync(resolved);
  const realPath = fs.existsSync(raw) ? raw : resolved;
  const extension = path.extname(raw).toLowerCase() || null;

  if (!exists) {
    const looksLikeFile = Boolean(extension) && raw.length < 300;
    return {
      input: raw,
      mode: looksLikeFile ? 'unavailable' : 'noteOnly',
      available: !looksLikeFile,
      sourceKind: looksLikeFile ? (IMAGE_EXTENSIONS.has(extension) ? 'image' : 'unknown') : inferKindFromText(raw),
      metadata: { exists: false, extension, fileCount: 0, byteSize: null },
      warnings: looksLikeFile ? [] : ['No file was found; treating input as a note/concept reference.'],
      blockers: looksLikeFile ? [`Reference path is unavailable: ${raw}`] : [],
    };
  }

  const stat = fs.statSync(realPath);
  if (stat.isDirectory()) {
    const children = fs.readdirSync(realPath, { withFileTypes: true });
    return {
      input: raw,
      resolvedPath: realPath,
      mode: 'folder',
      available: true,
      sourceKind: 'folder',
      metadata: {
        exists: true,
        extension: null,
        fileCount: children.length,
        byteSize: null,
        imageCount: children.filter((entry) => entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())).length,
        textCount: children.filter((entry) => entry.isFile() && TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())).length,
      },
      warnings: [],
      blockers: [],
    };
  }

  const isImage = IMAGE_EXTENSIONS.has(extension);
  return {
    input: raw,
    resolvedPath: realPath,
    mode: isImage ? 'localFile' : 'localFile',
    available: true,
    sourceKind: isImage ? 'image' : (TEXT_EXTENSIONS.has(extension) ? 'note' : 'unknown'),
    metadata: { exists: true, extension, fileCount: 1, byteSize: stat.size },
    warnings: isImage ? ['Image file detected. Pixel analysis requires configured API vision; metadata/note analysis remains available.'] : [],
    blockers: [],
  };
}

function inferKindFromText(text = '') {
  const q = safeText(text).toLowerCase();
  if (q.includes('screenshot')) return 'screenshot';
  if (q.includes('concept') || q.includes('sketch')) return 'concept';
  if (q.includes('moodboard')) return 'moodboard';
  if (q.includes('image') || q.includes('reference')) return 'image';
  return 'note';
}

function privacyFor(classification, apiConfigured = false, sentToApi = false) {
  return {
    rawImageStored: false,
    sentToApi: Boolean(sentToApi),
    redacted: true,
    apiConfigured: Boolean(apiConfigured),
    note: classification && classification.sourceKind === 'image'
      ? 'Raw image bytes are not stored by default. API vision is opt-in via configured local API key.'
      : 'Reference text/metadata is stored only as redacted structured summaries.',
  };
}

module.exports = {
  classifySource,
  inferKindFromText,
  privacyFor,
};
