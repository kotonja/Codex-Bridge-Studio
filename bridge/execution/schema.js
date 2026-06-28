'use strict';

const VERSION = '0.72.0';

const ROOTS = {
  workspace: {
    production: 'Workspace.CodexProduction',
    worldgen: 'Workspace.CodexWorldgen',
    assetForge: 'Workspace.CodexAssetForge',
    cinematic: 'Workspace.CodexCinematicDirector',
    qaSwarm: 'Workspace.CodexQaSwarm',
    autopilot: 'Workspace.CodexAutopilot',
    execution: 'Workspace.CodexExecutionKernel',
    markers: 'Workspace.CodexExecutionKernel.Markers',
    preview: 'Workspace.CodexExecutionKernel.Preview',
    applied: 'Workspace.CodexExecutionKernel.Applied',
  },
  replicatedStorage: {
    manifests: 'ReplicatedStorage.CodexProductionManifests',
    premium: 'ReplicatedStorage.CodexPremiumDirector',
    worldgen: 'ReplicatedStorage.CodexWorldgen',
    assetForge: 'ReplicatedStorage.CodexAssetForge',
    cinematic: 'ReplicatedStorage.CodexCinematicDirector',
    qaSwarm: 'ReplicatedStorage.CodexQaSwarm',
    autopilot: 'ReplicatedStorage.CodexAutopilot',
    execution: 'ReplicatedStorage.CodexExecutionKernel',
    transactions: 'ReplicatedStorage.CodexExecutionKernel.Transactions',
    receipts: 'ReplicatedStorage.CodexExecutionKernel.Receipts',
    manifestsRoot: 'ReplicatedStorage.CodexExecutionKernel.Manifests',
    rollback: 'ReplicatedStorage.CodexExecutionKernel.Rollback',
    verification: 'ReplicatedStorage.CodexExecutionKernel.Verification',
    memory: 'ReplicatedStorage.CodexProductionMemory',
  },
  optional: {
    ui: 'StarterGui.CodexGeneratedUI',
    audio: 'SoundService.CodexGeneratedMix',
    lighting: 'Lighting.CodexLightingProfiles',
  },
};

const CAPABILITIES = [
  'codexOwnedRoots',
  'transactionReceipts',
  'rollbackPlans',
  'previewBeforeApply',
  'worldgenCompilation',
  'assetkitCompilation',
  'cinematicCompilation',
  'qaMarkerCompilation',
  'safeFixCompilation',
  'verificationReports',
  'autopilotIntegration',
  'memoryIntegration',
];

const SAFETY = {
  onlyCodexOwnedMutationsByDefault: true,
  blocksNonCodexDeletes: true,
  blocksPublishUploadMarketplaceDataStoreEconomy: true,
  requiresEvidenceForSafeFix: true,
  rollbackLimitedToCodexRoots: true,
};

const SYSTEMS = {
  generic: 'ExecutionKernel',
  worldgen: 'Worldgen',
  assetkit: 'AssetForge',
  cinematic: 'Cinematic',
  qaMarkers: 'QaSwarm',
  polish: 'Autopilot',
  safeFix: 'Autopilot',
  premium: 'Premium',
};

const SAFE_CLASSES = [
  'Folder',
  'Model',
  'Part',
  'MeshPart',
  'Attachment',
  'PointLight',
  'SpotLight',
  'SurfaceLight',
  'Beam',
  'Trail',
  'ParticleEmitter',
  'BillboardGui',
  'SurfaceGui',
  'TextLabel',
  'ProximityPrompt',
  'Sound',
  'StringValue',
];

const EXTERNAL_RISK_PATTERN = /\b(publish|upload|marketplace|purchase|product|gamepass|datastore|save\s*data|economy|currency|robux|developer\s*product|asset\s*insert|insert\s*asset)\b/i;

function nowIso() {
  return new Date().toISOString();
}

function safeGoal(goal) {
  return String(goal || '').trim().replace(/\s+/g, ' ') || 'premium Roblox production build';
}

function slugify(value, fallback = 'execution') {
  const slug = safeGoal(value)
    .replace(/[^0-9A-Za-z]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
  return slug || fallback;
}

function transactionId(goal, system = 'ExecutionKernel') {
  const crypto = require('node:crypto');
  const base = `${system}:${safeGoal(goal)}:${nowIso()}:${crypto.randomUUID()}`;
  return `tx_${slugify(system, 'Execution')}_${crypto.createHash('sha256').update(base).digest('hex').slice(0, 14)}`;
}

function allCodexRoots() {
  return [
    ...Object.values(ROOTS.workspace),
    ...Object.values(ROOTS.replicatedStorage),
    ...Object.values(ROOTS.optional),
  ];
}

function isCodexPath(path) {
  const text = String(path || '');
  return allCodexRoots().some((root) => text === root || text.startsWith(`${root}.`))
    || /(^|\.)Codex[A-Za-z0-9_]+/.test(text);
}

module.exports = {
  VERSION,
  ROOTS,
  CAPABILITIES,
  SAFETY,
  SYSTEMS,
  SAFE_CLASSES,
  EXTERNAL_RISK_PATTERN,
  allCodexRoots,
  isCodexPath,
  nowIso,
  safeGoal,
  slugify,
  transactionId,
};
