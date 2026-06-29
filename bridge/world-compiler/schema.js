'use strict';

const path = require('node:path');
const crypto = require('node:crypto');

const VERSION = '0.76.0';
const STORE_ROOT = path.join(process.cwd(), '.codex-studio', 'world-compiler-v76');
const DIRS = {
  manifests: path.join(STORE_ROOT, 'manifests'),
  memory: path.join(STORE_ROOT, 'memory'),
};

const CAPABILITIES = [
  'referenceToPlayableWorld',
  'noteOnlyCompile',
  'apiVisionWhenConfigured',
  'referenceLabBridge',
  'structuralReconstructionBridge',
  'worldgenBridge',
  'assetforgeBridge',
  'cinematicBridge',
  'qaBridge',
  'executionPreviewBridge',
  'memoryIntegration',
  'fidelityScoring',
  'playabilityScoring',
  'manualRequiredHonesty',
];

const SAFETY = {
  compileIsPlanOnlyByDefault: true,
  executionRequiresV72: true,
  doesNotFakeImageAnalysis: true,
  doesNotFakePixelAnalysis: true,
  doesNotStoreRawImagesByDefault: true,
  doesNotMutateStudioDirectly: true,
  noPublishUploadMarketplaceDatastoreEconomyMutation: true,
};

const PIPELINE = [
  'reference',
  'reconstruction',
  'premium',
  'worldgen',
  'assetforge',
  'cinematic',
  'qa',
  'executionPreview',
  'memory',
];

function nowIso() {
  return new Date().toISOString();
}

function safeText(value = '', fallback = 'Roblox reference world') {
  return String(value == null ? fallback : value).replace(/\s+/g, ' ').trim() || fallback;
}

function safeGoal(value = '', fallback = 'premium Roblox reference world') {
  return safeText(value, fallback).slice(0, 260) || fallback;
}

function slugify(value = 'worldcompile', fallback = 'worldcompile') {
  const slug = safeText(value, fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
  return slug || fallback;
}

function hash(value) {
  return crypto.createHash('sha256').update(String(value == null ? '' : value)).digest('hex');
}

function stableCompilerId(source = 'worldcompile') {
  return `worldcompile_${slugify(source)}_${hash(source).slice(0, 10)}`;
}

function clamp01(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(1, Math.round(number * 100) / 100));
}

function clampScore(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function base(extra = {}) {
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    warnings: [],
    blockers: [],
    ...extra,
  };
}

function quote(value = '') {
  return `"${safeText(value).replace(/"/g, '\\"')}"`;
}

module.exports = {
  CAPABILITIES,
  DIRS,
  PIPELINE,
  SAFETY,
  STORE_ROOT,
  VERSION,
  base,
  clamp01,
  clampScore,
  hash,
  nowIso,
  quote,
  safeGoal,
  safeText,
  slugify,
  stableCompilerId,
};
