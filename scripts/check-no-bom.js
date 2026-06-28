'use strict';

const fs = require('node:fs');
const path = require('node:path');
const childProcess = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const TEXT_EXTENSIONS = new Set([
  '.js',
  '.json',
  '.md',
  '.ps1',
  '.cmd',
  '.lua',
  '.toml',
  '.yml',
  '.yaml',
  '.txt',
]);
const IGNORED_PARTS = new Set([
  '.git',
  'node_modules',
  '.codex-studio',
  'logs',
  'snapshots',
  'snapshot',
  'tmp',
  'temp',
]);

function toPosix(file) {
  return file.replace(/\\/g, '/');
}

function shouldIgnore(file) {
  return toPosix(file).split('/').some((part) => IGNORED_PARTS.has(part));
}

function trackedFiles() {
  try {
    return childProcess.execFileSync('git', ['ls-files'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).split(/\r?\n/).filter(Boolean);
  } catch (error) {
    const out = [];
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        const rel = path.relative(ROOT, full);
        if (shouldIgnore(rel)) continue;
        if (entry.isDirectory()) walk(full);
        else if (entry.isFile()) out.push(toPosix(rel));
      }
    };
    walk(ROOT);
    return out;
  }
}

function lineColumn(text, index) {
  const before = text.slice(0, index);
  const lines = before.split(/\n/);
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
}

function checkFile(relativePath) {
  if (shouldIgnore(relativePath)) return [];
  if (!TEXT_EXTENSIONS.has(path.extname(relativePath).toLowerCase())) return [];
  const absolutePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) return [];
  const buffer = fs.readFileSync(absolutePath);
  const text = buffer.toString('utf8');
  const hits = [];
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    hits.push({
      file: toPosix(relativePath),
      line: 1,
      column: 1,
      reason: 'File starts with UTF-8 BOM bytes EF BB BF.',
    });
  }
  let index = text.indexOf('\ufeff');
  while (index !== -1) {
    const pos = lineColumn(text, index);
    hits.push({
      file: toPosix(relativePath),
      line: pos.line,
      column: pos.column,
      reason: 'U+FEFF detected; Roblox Lua will fail to parse this plugin if bundled.',
    });
    index = text.indexOf('\ufeff', index + 1);
  }
  return hits;
}

function main() {
  const files = trackedFiles();
  const checked = [];
  const hits = [];
  for (const file of files) {
    if (shouldIgnore(file)) continue;
    if (!TEXT_EXTENSIONS.has(path.extname(file).toLowerCase())) continue;
    checked.push(toPosix(file));
    hits.push(...checkFile(file));
  }
  const result = {
    ok: hits.length === 0,
    checkedFileCount: checked.length,
    hitCount: hits.length,
    hits,
    message: hits.length
      ? 'BOM/U+FEFF detected; Roblox Lua will fail to parse this plugin.'
      : 'No BOM/U+FEFF detected in tracked text files.',
  };
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
}

if (require.main === module) {
  main();
}

module.exports = { checkFile, trackedFiles };
