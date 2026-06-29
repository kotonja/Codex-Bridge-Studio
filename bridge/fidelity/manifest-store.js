'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { STORE_ROOT, slugify } = require('./schema');

function saveManifest(report = {}) {
  const dir = path.join(STORE_ROOT, 'manifests');
  fs.mkdirSync(dir, { recursive: true });
  const file = `${slugify(report.goal || report.comparisonId || 'fidelity')}.json`;
  const absoluteFile = path.join(dir, file);
  fs.writeFileSync(absoluteFile, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return {
    absoluteFile,
    relativeFile: path.relative(process.cwd(), absoluteFile).replace(/\\/g, '/'),
  };
}

module.exports = { saveManifest };
