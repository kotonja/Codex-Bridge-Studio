'use strict';

const path = require('node:path');
const crypto = require('node:crypto');

const VERSION = '0.75.0';
const STORE_ROOT = path.join(process.cwd(), '.codex-studio', 'reconstruction-v75');
const DIRS = {
  manifests: path.join(STORE_ROOT, 'manifests'),
  memory: path.join(STORE_ROOT, 'memory'),
};

const CAPABILITIES = [
  'missingViewInference',
  'interiorFromExterior',
  'backsideInference',
  'floorplanInference',
  'roomGraphPlanning',
  'routeInference',
  'gameplaySpacePlanning',
  'collisionZoneInference',
  'verticalityInference',
  'variantGeneration',
  'worldgenBridge',
  'assetforgeBridge',
  'executionPlanBridge',
  'memoryIntegration',
  'referenceLabIntegration',
];

const SAFETY = {
  readOnlyByDefault: true,
  doesNotClaimCertainty: true,
  requiresConfidence: true,
  executionRequiresV72: true,
  doesNotMutateStudioDirectly: true,
  doesNotStoreRawImages: true,
  noPublishUploadMarketplaceDatastoreEconomyMutation: true,
};

function nowIso() {
  return new Date().toISOString();
}

function safeText(value = '', fallback = 'Roblox structure reference') {
  return String(value == null ? fallback : value).replace(/\s+/g, ' ').trim() || fallback;
}

function slugify(value = 'reconstruction', fallback = 'reconstruction') {
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

function stableReconstructionId(source = 'reconstruction') {
  return `recon_${slugify(source)}_${hash(source).slice(0, 10)}`;
}

function clampConfidence(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(1, Math.round(number * 100) / 100));
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

function inferenceItem(id, inference, reason, confidence, options = {}) {
  const cleanConfidence = clampConfidence(confidence);
  return {
    id,
    inference,
    reason,
    confidence: cleanConfidence,
    sourceEvidence: Array.isArray(options.sourceEvidence) ? options.sourceEvidence.filter(Boolean).slice(0, 12) : [],
    risk: options.risk || (cleanConfidence < 0.45 ? 'high' : cleanConfidence < 0.7 ? 'medium' : 'low'),
    alternatives: Array.isArray(options.alternatives) ? options.alternatives.slice(0, 6) : [],
    needsUserReference: options.needsUserReference === true || cleanConfidence < 0.38,
  };
}

function withNext(goal, command, extra = {}) {
  const cleanGoal = safeText(goal);
  return {
    ...extra,
    nextCommand: `${command} "${cleanGoal.replace(/"/g, '\\"')}"`,
  };
}

module.exports = {
  CAPABILITIES,
  DIRS,
  SAFETY,
  STORE_ROOT,
  VERSION,
  base,
  clampConfidence,
  hash,
  inferenceItem,
  nowIso,
  safeText,
  slugify,
  stableReconstructionId,
  withNext,
};

