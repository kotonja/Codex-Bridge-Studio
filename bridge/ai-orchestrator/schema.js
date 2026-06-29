'use strict';

const path = require('node:path');

const VERSION = '0.74.0';
const STORE_ROOT = path.join(process.cwd(), '.codex-studio', 'ai-runs-v73');
const DIRS = {
  runs: path.join(STORE_ROOT, 'runs'),
  reports: path.join(STORE_ROOT, 'reports'),
  references: path.join(STORE_ROOT, 'references'),
  cost: path.join(STORE_ROOT, 'cost'),
};

const CAPABILITIES = [
  'safeLocalApiKeyPolicy',
  'structuredToolCalling',
  'bridgeToolCatalog',
  'productionPlanGeneration',
  'referenceIntakeFoundation',
  'approvalGates',
  'costTracking',
  'runState',
  'executionKernelIntegration',
  'memoryIntegration',
];

const INTEGRATIONS = {
  executionKernel: true,
  memory: true,
  autopilot: true,
  premium: true,
  visual: true,
  worldgen: true,
  assetforge: true,
  cinematic: true,
  qa: true,
};

const DEFAULT_MODEL = process.env.CODEX_STUDIO_AI_MODEL || 'gpt-4.1-mini';
const MAX_STEPS = Number(process.env.CODEX_STUDIO_AI_MAX_STEPS || 8);
const MAX_TOOL_CALLS = Number(process.env.CODEX_STUDIO_AI_MAX_TOOL_CALLS || 12);

function nowIso() {
  return new Date().toISOString();
}

function slugify(value = 'ai-run', fallback = 'ai-run') {
  const slug = String(value || '')
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 72);
  return slug || fallback;
}

function runId(goal = 'ai-run') {
  const crypto = require('node:crypto');
  return `ai_${slugify(goal)}_${crypto.createHash('sha256').update(`${goal}:${Date.now()}:${Math.random()}`).digest('hex').slice(0, 10)}`;
}

function referenceId(source = 'reference') {
  const crypto = require('node:crypto');
  return `ref_${slugify(source, 'reference')}_${crypto.createHash('sha256').update(`${source}:${Date.now()}:${Math.random()}`).digest('hex').slice(0, 8)}`;
}

module.exports = {
  CAPABILITIES,
  DEFAULT_MODEL,
  DIRS,
  INTEGRATIONS,
  MAX_STEPS,
  MAX_TOOL_CALLS,
  STORE_ROOT,
  VERSION,
  nowIso,
  referenceId,
  runId,
  slugify,
};
