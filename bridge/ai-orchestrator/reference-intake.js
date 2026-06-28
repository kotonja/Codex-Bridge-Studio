'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { VERSION, nowIso, referenceId } = require('./schema');
const Store = require('./run-store');

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif']);

function intakeReference(source, metadata = {}) {
  const raw = String(source || '').trim();
  const exists = raw ? fs.existsSync(raw) : false;
  const stat = exists ? fs.statSync(raw) : null;
  const ext = raw ? path.extname(raw).toLowerCase() : '';
  const isImage = IMAGE_EXTENSIONS.has(ext);
  const mode = exists
    ? (stat.isDirectory() ? 'folder' : (isImage ? 'imagePlaceholder' : 'path'))
    : (isImage ? 'imagePlaceholder' : 'note');
  const result = {
    ok: true,
    version: VERSION,
    at: nowIso(),
    referenceId: referenceId(raw || 'note'),
    source: raw,
    mode,
    available: exists || mode === 'note',
    extractedMetadata: {
      exists,
      isDirectory: Boolean(stat && stat.isDirectory()),
      bytes: stat && stat.isFile() ? stat.size : null,
      extension: ext || null,
      suppliedMetadata: metadata,
    },
    futureV74ImageUnderstanding: true,
    actualImageAnalysis: false,
    suggestedNextCommand: `tools\\bridge.cmd memory remember "${raw.replace(/"/g, '\\"').slice(0, 160)}"`,
    warnings: isImage ? ['V73 stores image metadata only; pixel/image understanding is V74+ unless a future API vision call is explicitly made.'] : [],
    blockers: [],
  };
  Store.saveReference(result);
  return result;
}

module.exports = {
  intakeReference,
};
