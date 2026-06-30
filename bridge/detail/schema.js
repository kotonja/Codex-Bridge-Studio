'use strict';

const VERSION = '0.89.0';

const ROOTS = {
  workspace: 'Workspace.CodexProduction.DetailCompiler',
  replicatedStorage: 'ReplicatedStorage.CodexDetailCompiler',
  premiumMirror: 'ReplicatedStorage.CodexPremiumDirector.DetailCompiler',
  executionMirror: 'ReplicatedStorage.CodexExecutionKernel.DetailCompiler',
};

const CAPABILITIES = [
  'highDetailPrimitiveComposition',
  'portalGateCompiler',
  'buildingFacadeCompiler',
  'interiorRoomCompiler',
  'pathAndEdgeCompiler',
  'propClusterCompiler',
  'lightingFixtureCompiler',
  'materialSwatchCompiler',
  'vfxAudioCameraSocketCompiler',
  'collisionProxyCompiler',
  'mobileDensityBudget',
  'executionKernelPreviewBridge',
  'receiptRollbackCompatibility',
];

const SAFETY = {
  codexOwnedRootsOnly: true,
  mutatesStudioOnlyThroughExecutionKernel: true,
  noMarketplaceUploadPublishDataStoreEconomy: true,
  noFakeMeshTextureAssetIds: true,
  noProductionScriptEdits: true,
  rollbackScopedToTransactionReceipts: true,
};

const AUDIT_KEYS = [
  'silhouetteStrength',
  'macroShapeReadability',
  'trimAndBevelDepth',
  'materialVariety',
  'scaleHierarchy',
  'propDensity',
  'lightingFixtureClarity',
  'socketCoverage',
  'collisionProxyCoverage',
  'mobilePartBudget',
  'vfxReadiness',
  'premiumDetailFeel',
];

const POLISH_STAGES = [
  'strengthen macro silhouette',
  'add secondary trim rhythm',
  'add bevel illusion bands',
  'break up flat walls',
  'add grounded prop clusters',
  'add material swatches and contrast',
  'add lighting fixtures with sockets',
  'add portal/VFX/audio/camera sockets',
  'reduce tiny clutter for mobile',
  'rerun visual and fidelity critique',
];

function nowIso() {
  return new Date().toISOString();
}

function safeGoal(goal) {
  return String(goal || '').trim().replace(/\s+/g, ' ') || 'premium high-detail Roblox build';
}

function slugify(value, fallback = 'detail') {
  const slug = safeGoal(value)
    .replace(/[^0-9A-Za-z]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 58);
  return slug || fallback;
}

function clampScore(value) {
  const number = Number(value);
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(number) ? number : 0)));
}

function vec3(x, y, z) {
  return { x, y, z };
}

function color(r, g, b) {
  return { r, g, b };
}

function baseAttributes(role, goal, extra = {}) {
  return {
    CodexGenerated: true,
    CodexSystem: 'DetailCompiler',
    CodexVersion: VERSION,
    CodexGoal: safeGoal(goal),
    CodexDetailRole: role || 'detail',
    ...extra,
  };
}

function detailBasePath(goal, suffix = 'Preview') {
  return `${ROOTS.workspace}.${slugify(goal, 'detail')}_${suffix}`;
}

function detailManifestPath(goal, suffix = 'Preview') {
  return `${ROOTS.replicatedStorage}.${slugify(goal, 'detail')}_${suffix}.DetailManifest`;
}

module.exports = {
  VERSION,
  ROOTS,
  CAPABILITIES,
  SAFETY,
  AUDIT_KEYS,
  POLISH_STAGES,
  baseAttributes,
  clampScore,
  color,
  detailBasePath,
  detailManifestPath,
  nowIso,
  safeGoal,
  slugify,
  vec3,
};
