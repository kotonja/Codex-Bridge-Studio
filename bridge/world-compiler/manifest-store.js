'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { DIRS, slugify } = require('./schema');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function saveManifest(manifest) {
  ensureDir(DIRS.manifests);
  const file = `${slugify(manifest.goal || manifest.packageId || 'worldcompile')}.json`;
  const absoluteFile = path.join(DIRS.manifests, file);
  fs.writeFileSync(absoluteFile, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return {
    absoluteFile,
    relativeFile: path.relative(process.cwd(), absoluteFile),
  };
}

module.exports = { saveManifest };
