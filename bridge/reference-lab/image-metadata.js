'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { IMAGE_EXTENSIONS, hash, safeText } = require('./schema');

const MIME_BY_EXTENSION = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.bmp': 'image/bmp',
};

function toSafeDisplayPath(filePath, absolutePath) {
  const relative = path.relative(process.cwd(), absolutePath);
  if (relative && !relative.startsWith('..') && !path.isAbsolute(relative)) return relative.replace(/\\/g, '/');
  return `${path.basename(filePath || absolutePath)}#${hash(absolutePath).slice(0, 8)}`;
}

function locatePath(input = '') {
  const raw = safeText(input);
  const direct = raw ? path.resolve(raw) : '';
  if (raw && fs.existsSync(raw)) return path.resolve(raw);
  if (direct && fs.existsSync(direct)) return direct;
  return direct || raw;
}

function sha256FileSync(filePath) {
  const hashValue = crypto.createHash('sha256');
  hashValue.update(fs.readFileSync(filePath));
  return hashValue.digest('hex');
}

function readPngDimensions(filePath) {
  const buffer = Buffer.alloc(24);
  const fd = fs.openSync(filePath, 'r');
  try {
    fs.readSync(fd, buffer, 0, 24, 0);
  } finally {
    fs.closeSync(fd);
  }
  const pngSignature = '89504e470d0a1a0a';
  if (buffer.slice(0, 8).toString('hex') !== pngSignature) return null;
  if (buffer.slice(12, 16).toString('ascii') !== 'IHDR') return null;
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    source: 'pngHeader',
  };
}

function getImageMetadata(input = '', options = {}) {
  const raw = safeText(input);
  const absolutePath = locatePath(raw);
  const extension = path.extname(raw || absolutePath || '').toLowerCase() || null;
  const supportedImageExtension = IMAGE_EXTENSIONS.has(extension);
  const baseUnavailable = {
    inputType: 'localImageFile',
    available: false,
    exists: false,
    isFile: false,
    extension,
    supportedImageExtension,
    fileName: raw ? path.basename(raw) : null,
    displayPath: raw ? toSafeDisplayPath(raw, absolutePath || raw) : null,
    pathHash: absolutePath ? hash(absolutePath) : null,
    byteSize: null,
    sha256: null,
    lastModified: null,
    dimensions: null,
    mimeType: extension ? MIME_BY_EXTENSION[extension] || 'application/octet-stream' : null,
    rawBytesStored: false,
    warnings: [],
    blockers: ['Image path is missing or unreadable.'],
  };
  if (!raw || !absolutePath || !fs.existsSync(absolutePath)) return baseUnavailable;
  const stat = fs.statSync(absolutePath);
  if (!stat.isFile()) {
    return {
      ...baseUnavailable,
      exists: true,
      isFile: false,
      blockers: ['Image path exists but is not a file.'],
    };
  }
  let dimensions = null;
  const warnings = [];
  try {
    if (extension === '.png') dimensions = readPngDimensions(absolutePath);
  } catch (error) {
    warnings.push(`PNG dimension read failed: ${String(error.message || error).slice(0, 140)}`);
  }
  return {
    inputType: 'localImageFile',
    available: true,
    exists: true,
    isFile: true,
    extension,
    supportedImageExtension,
    fileName: path.basename(absolutePath),
    displayPath: toSafeDisplayPath(raw, absolutePath),
    pathHash: hash(absolutePath),
    byteSize: stat.size,
    sha256: sha256FileSync(absolutePath),
    lastModified: stat.mtime.toISOString(),
    dimensions,
    mimeType: MIME_BY_EXTENSION[extension] || 'application/octet-stream',
    rawBytesStored: false,
    warnings: supportedImageExtension ? warnings : [...warnings, 'File extension is not one of png/jpg/jpeg/webp/gif/bmp.'],
    blockers: supportedImageExtension ? [] : ['File does not look like a supported image extension.'],
    _absolutePath: options.includeAbsolutePath ? absolutePath : undefined,
  };
}

module.exports = {
  MIME_BY_EXTENSION,
  getImageMetadata,
};
