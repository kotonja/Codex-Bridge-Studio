'use strict';

const crypto = require('node:crypto');
const path = require('node:path');

const VERSION = '0.80.0';
const STORE_ROOT = path.join(process.cwd(), '.codex-studio', 'fidelity-v80');

const CAPABILITIES = [
  'profileBasedComparison',
  'imageVisionComparisonWhenAvailable',
  'studioEvidenceComparison',
  'styleFidelity',
  'shapeFidelity',
  'materialFidelity',
  'lightingFidelity',
  'layoutFidelity',
  'objectFidelity',
  'gameplayAdaptationAnalysis',
  'safeFixPlanning',
  'memoryIntegration',
  'worldcompileIntegration',
  'visualIntegration',
  'executionIntegration',
];

const SCORE_KEYS = [
  'styleFidelity',
  'shapeLanguageFidelity',
  'materialFidelity',
  'lightingMoodFidelity',
  'focalHierarchyFidelity',
  'objectCoverage',
  'layoutFidelity',
  'gameplayAdaptation',
  'mobileAdaptation',
  'overall',
];

function nowIso() {
  return new Date().toISOString();
}

function safeText(value = '', fallback = '') {
  return String(value == null ? fallback : value).replace(/\s+/g, ' ').trim();
}

function safeGoal(value = '', fallback = 'Roblox reference fidelity comparison') {
  return safeText(value, fallback).slice(0, 320) || fallback;
}

function quote(value = '') {
  return `"${safeText(value).replace(/"/g, '\\"')}"`;
}

function slugify(value = '', fallback = 'fidelity') {
  const slug = safeText(value, fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
  return slug || fallback;
}

function hash(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function stableFidelityId(goal = '', salt = '') {
  return `fidelity_${slugify(goal)}_${hash({ goal, salt }).slice(0, 10)}`;
}

function clampScore(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function confidence(value, fallback = 0.5) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(1, Number(n.toFixed(2))));
}

function arr(value) {
  if (Array.isArray(value)) return value.map((item) => safeText(item)).filter(Boolean);
  if (typeof value === 'string' && value.trim()) return [safeText(value)];
  return [];
}

function words(value) {
  return safeText(value)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !['the', 'and', 'with', 'from', 'that', 'this', 'for'].includes(word));
}

function tokenSet(...values) {
  const set = new Set();
  for (const value of values.flat(Infinity)) {
    for (const word of words(value)) set.add(word);
  }
  return set;
}

function overlapScore(expected = [], observed = [], options = {}) {
  const expectedTokens = tokenSet(expected);
  const observedTokens = tokenSet(observed);
  if (!expectedTokens.size) return clampScore(options.emptyScore ?? 70);
  let hits = 0;
  for (const token of expectedTokens) {
    if (observedTokens.has(token)) hits += 1;
  }
  const ratio = hits / expectedTokens.size;
  const base = options.base ?? 42;
  const span = options.span ?? 52;
  return clampScore(base + ratio * span);
}

function base(extra = {}) {
  return { ok: true, version: VERSION, at: nowIso(), warnings: [], blockers: [], ...extra };
}

module.exports = {
  VERSION,
  STORE_ROOT,
  CAPABILITIES,
  SCORE_KEYS,
  arr,
  base,
  clampScore,
  confidence,
  hash,
  nowIso,
  overlapScore,
  quote,
  safeGoal,
  safeText,
  slugify,
  stableFidelityId,
  tokenSet,
  words,
};
