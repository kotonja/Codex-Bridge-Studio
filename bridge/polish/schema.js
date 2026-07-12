'use strict';

const crypto = require('node:crypto');
const path = require('node:path');

const VERSION = '0.97.0';

const ROOTS = {
  local: path.join(process.cwd(), '.codex-studio', 'polish-v96'),
  workspace: 'Workspace.CodexAutopilot',
  execution: 'Workspace.CodexAutopilot.ExecutionPolish',
  replicatedStorage: 'ReplicatedStorage.CodexAutopilot.Polish',
  memory: 'ReplicatedStorage.CodexProductionMemory',
};

const CAPABILITIES = [
  'baselineScoreCollection',
  'visualIssueIntegration',
  'fidelityIssueIntegration',
  'architectureIssueIntegration',
  'detailIssueIntegration',
  'materialIssueIntegration',
  'qaIssueIntegration',
  'premiumScoreIntegration',
  'autopilotScoreIntegration',
  'safePolishPlanning',
  'executionKernelPreview',
  'approvalRequiredApply',
  'scoreDeltaTracking',
  'memoryLearning',
  'rollbackSupport',
];

const SAFETY = {
  codexOwnedOnly: true,
  evidenceRequiredForFix: true,
  executionRequiresV72: true,
  approvalRequired: true,
  manualRequiredForExternalAssets: true,
  noPublishUploadMarketplaceDataStoreEconomy: true,
  noFakeMeshTexturePbrAssetIds: true,
  noArbitraryLuauExecution: true,
};

const STAGES = [
  'blockers/manualRequired triage',
  'architecture shape fixes',
  'detail/prop fixes',
  'material/color fixes',
  'lighting/glow fixes',
  'path/readability fixes',
  'QA/mobile fixes',
  'fidelity-focused fixes',
  're-score commands',
  'memory learn',
];

const SCORE_KEYS = ['visual', 'fidelity', 'architecture', 'detail', 'materials', 'qa', 'premium', 'autopilot'];

function nowIso() {
  return new Date().toISOString();
}

function safeGoal(value, fallback = 'premium dark purple anime dungeon gate hub') {
  return String(value == null ? fallback : value).replace(/\s+/g, ' ').trim().slice(0, 300) || fallback;
}

function slugify(value, fallback = 'polish') {
  const slug = safeGoal(value, fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
  return slug || fallback;
}

function stableId(prefix, goal) {
  return `${prefix}_${slugify(goal)}_${crypto.createHash('sha256').update(safeGoal(goal)).digest('hex').slice(0, 12)}`;
}

function clampScore(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function scoreOf(report, keys = []) {
  if (!report || typeof report !== 'object') return null;
  for (const key of [...keys, 'overallScore', 'finalScore', 'launchReadinessScore', 'score', 'overall']) {
    if (report[key] !== undefined) {
      const score = clampScore(report[key]);
      if (score !== null) return score;
    }
  }
  if (report.qualityScore && typeof report.qualityScore === 'object') return scoreOf(report.qualityScore);
  return null;
}

function base(extra = {}) {
  return { ok: true, version: VERSION, at: nowIso(), warnings: [], blockers: [], ...extra };
}

module.exports = {
  VERSION,
  ROOTS,
  CAPABILITIES,
  SAFETY,
  STAGES,
  SCORE_KEYS,
  base,
  clampScore,
  nowIso,
  safeGoal,
  scoreOf,
  slugify,
  stableId,
};
