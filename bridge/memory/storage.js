'use strict';

const fs = require('fs');
const path = require('path');
const { CATEGORY_DIRS, MEMORY_ROOT, VERSION, defaultUserTaste, emptyProjectProfile, nowIso } = require('./schema');
const { redact } = require('./redaction');

function rootOf(options = {}) {
  return options.root || MEMORY_ROOT;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (_) {
    return fallback;
  }
}

function writeJson(file, value) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${JSON.stringify(redact(value), null, 2)}\n`, 'utf8');
}

function ensureMemoryRoot(options = {}) {
  const root = rootOf(options);
  ensureDir(root);
  for (const dir of Object.values(CATEGORY_DIRS)) ensureDir(path.join(root, dir));
  ensureDir(path.join(root, 'exports'));
  ensureDir(path.join(root, 'manifests'));
  const indexPath = path.join(root, 'index.json');
  if (!fs.existsSync(indexPath)) writeJson(indexPath, { version: VERSION, at: nowIso(), updatedAt: nowIso(), itemCount: 0, items: [] });
  const profilePath = path.join(root, 'profile.json');
  if (!fs.existsSync(profilePath)) writeJson(profilePath, emptyProjectProfile(options));
  const tastePath = path.join(root, 'taste.json');
  if (!fs.existsSync(tastePath)) writeJson(tastePath, defaultUserTaste());
  return root;
}

function readIndex(options = {}) {
  const root = ensureMemoryRoot(options);
  const index = readJson(path.join(root, 'index.json'), { version: VERSION, items: [] });
  if (!Array.isArray(index.items)) index.items = [];
  return index;
}

function writeIndex(index, options = {}) {
  const root = ensureMemoryRoot(options);
  const next = { ...index, version: VERSION, updatedAt: nowIso(), itemCount: Array.isArray(index.items) ? index.items.length : 0 };
  writeJson(path.join(root, 'index.json'), next);
  return next;
}

function writeItem(item, options = {}) {
  const root = ensureMemoryRoot(options);
  const dir = CATEGORY_DIRS[item.type] || CATEGORY_DIRS.note;
  const file = path.join(root, dir, `${item.id}.json`);
  const stored = { ...item, version: VERSION, updatedAt: nowIso() };
  writeJson(file, stored);
  const rel = path.relative(root, file).replace(/\\/g, '/');
  const index = readIndex(options);
  const summary = {
    id: stored.id,
    type: stored.type,
    goal: stored.goal,
    summary: stored.summary,
    tags: stored.tags || [],
    source: stored.source,
    at: stored.at,
    updatedAt: stored.updatedAt,
    file: rel,
  };
  index.items = index.items.filter((entry) => entry.id !== stored.id).concat(summary);
  writeIndex(index, options);
  return { item: stored, file, relativeFile: rel };
}

function readItem(entry, options = {}) {
  const root = ensureMemoryRoot(options);
  if (!entry || !entry.file) return null;
  return readJson(path.join(root, entry.file), null);
}

function listItems(options = {}) {
  return readIndex(options).items.slice().sort((a, b) => String(b.updatedAt || b.at).localeCompare(String(a.updatedAt || a.at)));
}

function readProfile(options = {}) {
  const root = ensureMemoryRoot(options);
  return readJson(path.join(root, 'profile.json'), emptyProjectProfile(options));
}

function writeProfile(profile, options = {}) {
  const root = ensureMemoryRoot(options);
  const next = { ...profile, version: VERSION, updatedAt: nowIso() };
  writeJson(path.join(root, 'profile.json'), next);
  return next;
}

function readTaste(options = {}) {
  const root = ensureMemoryRoot(options);
  return readJson(path.join(root, 'taste.json'), defaultUserTaste());
}

function writeTaste(taste, options = {}) {
  const root = ensureMemoryRoot(options);
  const next = { ...taste, version: VERSION, updatedAt: nowIso() };
  writeJson(path.join(root, 'taste.json'), next);
  return next;
}

function memoryStats(options = {}) {
  const root = ensureMemoryRoot(options);
  const index = readIndex(options);
  const byType = {};
  for (const item of index.items) byType[item.type] = (byType[item.type] || 0) + 1;
  return { root, itemCount: index.items.length, byType };
}

module.exports = {
  rootOf,
  ensureMemoryRoot,
  readJson,
  writeJson,
  readIndex,
  writeIndex,
  writeItem,
  readItem,
  listItems,
  readProfile,
  writeProfile,
  readTaste,
  writeTaste,
  memoryStats,
};
