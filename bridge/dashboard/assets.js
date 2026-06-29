'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const STATIC_DIR = path.join(ROOT, 'dashboard');

function readDashboardAsset(name) {
  const allowed = new Set(['app.js', 'styles.css']);
  if (!allowed.has(name)) return null;
  const file = path.join(STATIC_DIR, name);
  if (!fs.existsSync(file)) return null;
  const content = fs.readFileSync(file, 'utf8');
  const contentType = name.endsWith('.css') ? 'text/css; charset=utf-8' : 'application/javascript; charset=utf-8';
  return { content, contentType };
}

module.exports = { readDashboardAsset };
