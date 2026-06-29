'use strict';

const path = require('path');
const crypto = require('crypto');

const VERSION = '0.74.0';
const MEMORY_ROOT = path.join(process.cwd(), '.codex-studio', 'memory-v71');

const ROOTS = {
  local: '.codex-studio/memory-v71',
  robloxMirror: 'ReplicatedStorage.CodexProductionMemory',
};

const TYPES = {
  note: 'note',
  styleBible: 'styleBible',
  referenceProfile: 'referenceProfile',
  lesson: 'lesson',
  score: 'score',
  issue: 'issue',
  assetKit: 'assetKit',
  worldLayout: 'worldLayout',
  cinematicMoment: 'cinematicMoment',
  qaLesson: 'qaLesson',
  autopilotRun: 'autopilotRun',
};

const CATEGORY_DIRS = {
  [TYPES.note]: 'notes',
  [TYPES.styleBible]: 'style-bibles',
  [TYPES.referenceProfile]: 'references',
  [TYPES.lesson]: 'lessons',
  [TYPES.score]: 'score-history',
  [TYPES.issue]: 'issues',
  [TYPES.assetKit]: 'asset-kits',
  [TYPES.worldLayout]: 'world-layouts',
  [TYPES.cinematicMoment]: 'cinematic-moments',
  [TYPES.qaLesson]: 'qa-lessons',
  [TYPES.autopilotRun]: 'autopilot-runs',
};

const CAPABILITIES = [
  'local redacted production memory',
  'project profile and user taste profile',
  'style bible and reference profile recall',
  'score history and issue pattern learning',
  'recommendations for premium, worldgen, assetforge, cinematic, QA, VFX, animation, and autopilot',
  'exportable memory packs with no tokens, raw source, or patch payloads',
];

const REDACTED_KEYS = [
  'token',
  'sessionToken',
  'pairingCode',
  'authorization',
  'cookie',
  'password',
  'secret',
  'rawSource',
  'scriptSource',
  'sourceText',
  'oldSource',
  'newSource',
  'patch',
  'patches',
  'mutationPayload',
  'patchPayload',
  'commandPayload',
];

function nowIso() {
  return new Date().toISOString();
}

function safeText(value, fallback = '') {
  return String(value == null ? fallback : value).replace(/\s+/g, ' ').trim();
}

function safeGoal(value, fallback = 'premium Roblox production goal') {
  return safeText(value, fallback).slice(0, 240) || fallback;
}

function slugify(value, fallback = 'memory') {
  const slug = safeText(value, fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return slug || fallback;
}

function hashValue(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function itemId(type, goal, payload = {}) {
  return `${slugify(type)}_${slugify(goal)}_${hashValue({ type, goal, payload }).slice(0, 12)}`;
}

function createMemoryItem(type, goal, payload = {}, options = {}) {
  const cleanType = Object.prototype.hasOwnProperty.call(CATEGORY_DIRS, type) ? type : TYPES.note;
  const cleanGoal = safeGoal(goal || payload.goal || options.goal);
  const at = options.at || nowIso();
  return {
    id: options.id || itemId(cleanType, cleanGoal, payload),
    version: VERSION,
    type: cleanType,
    goal: cleanGoal,
    tags: Array.isArray(options.tags) ? options.tags.slice(0, 20).map((tag) => safeText(tag)).filter(Boolean) : [],
    source: safeText(options.source || payload.source || 'productionMemory'),
    at,
    updatedAt: at,
    summary: safeText(options.summary || payload.summary || cleanGoal).slice(0, 500),
    payload,
  };
}

function emptyProjectProfile(options = {}) {
  const projectName = safeText(options.projectName || path.basename(process.cwd()), 'StudioBridge Project');
  return {
    version: VERSION,
    at: nowIso(),
    updatedAt: nowIso(),
    projectName,
    workspace: process.cwd(),
    preferredQualityBar: 'premium Roblox production',
    targetDevices: ['desktop', 'tablet', 'phone'],
    visualLanguage: ['readable silhouette', 'strong focal hierarchy', 'mobile-safe detail density'],
    gameplayPriorities: ['first minute clarity', 'reward feedback', 'performance-safe polish'],
    memoryPolicy: {
      storesRawSource: false,
      storesTokens: false,
      storesMutationPayloads: false,
      localOnlyByDefault: true,
    },
  };
}

function defaultUserTaste() {
  return {
    version: VERSION,
    updatedAt: nowIso(),
    preferences: [
      'premium visual finish',
      'clear gameplay readability',
      'high-impact VFX with mobile-safe budgets',
      'cinematic motion with anticipation, impact, and recovery',
      'organized reusable assets instead of random parts',
    ],
    avoid: [
      'generic placeholders left as final art',
      'fake screenshots or fake asset ids',
      'unbounded output history treated as current errors',
      'production script edits without explicit route',
    ],
  };
}

module.exports = {
  VERSION,
  MEMORY_ROOT,
  ROOTS,
  TYPES,
  CATEGORY_DIRS,
  CAPABILITIES,
  REDACTED_KEYS,
  nowIso,
  safeText,
  safeGoal,
  slugify,
  hashValue,
  itemId,
  createMemoryItem,
  emptyProjectProfile,
  defaultUserTaste,
};
