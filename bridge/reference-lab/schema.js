'use strict';

const path = require('node:path');
const crypto = require('node:crypto');

const VERSION = '0.78.0';
const STORE_ROOT = path.join(process.cwd(), '.codex-studio', 'reference-lab-v74');
const DIRS = {
  intake: path.join(STORE_ROOT, 'intake'),
  manifests: path.join(STORE_ROOT, 'manifests'),
  memory: path.join(STORE_ROOT, 'memory'),
};

const CAPABILITIES = [
  'referenceIntake',
  'localImageFileIntake',
  'explicitApiVisionWhenConfigured',
  'metadataOnlyFallback',
  'noteOnlyAnalysis',
  'apiImageAnalysisWhenConfigured',
  'styleExtraction',
  'sceneUnderstanding',
  'materialLanguageExtraction',
  'objectCandidateExtraction',
  'layoutHypotheses',
  'gameplayInterpretation',
  'missingViewQuestions',
  'productionHints',
  'memoryIntegration',
  'premiumIntegration',
  'worldgenIntegration',
  'assetforgeIntegration',
  'visualIntegration',
];

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif']);
const TEXT_EXTENSIONS = new Set(['.txt', '.md', '.json', '.csv', '.lua', '.js']);

function nowIso() {
  return new Date().toISOString();
}

function safeText(value = '', fallback = '') {
  return String(value == null ? fallback : value).replace(/\s+/g, ' ').trim();
}

function slugify(value = 'reference', fallback = 'reference') {
  const slug = safeText(value, fallback)
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 72);
  return slug || fallback;
}

function hash(value) {
  return crypto.createHash('sha256').update(String(value == null ? '' : value)).digest('hex');
}

function referenceId(source = 'reference') {
  return `ref_${slugify(source, 'reference')}_${hash(`${source}:${Date.now()}:${Math.random()}`).slice(0, 8)}`;
}

function stableReferenceId(source = 'reference') {
  return `ref_${slugify(source, 'reference')}_${hash(source).slice(0, 8)}`;
}

function base(extra = {}) {
  return { ok: true, version: VERSION, at: nowIso(), warnings: [], blockers: [], ...extra };
}

module.exports = {
  CAPABILITIES,
  DIRS,
  IMAGE_EXTENSIONS,
  STORE_ROOT,
  TEXT_EXTENSIONS,
  VERSION,
  base,
  hash,
  nowIso,
  referenceId,
  safeText,
  slugify,
  stableReferenceId,
};
