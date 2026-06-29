'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { DIRS, stableReconstructionId } = require('./schema');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function saveManifest(manifest) {
  ensureDir(DIRS.manifests);
  const id = manifest.reconstructionId || stableReconstructionId(manifest.goal || 'reconstruction');
  const file = path.join(DIRS.manifests, `${id}.json`);
  fs.writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return {
    path: file,
    relativeFile: path.relative(process.cwd(), file),
  };
}

module.exports = {
  saveManifest,
};

