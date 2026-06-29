'use strict';

const VERSION = '0.76.0';

const ROOTS = {
  replicatedStorage: 'ReplicatedStorage.CodexAutopilot',
  workspace: 'Workspace.CodexAutopilot',
  manifests: 'ReplicatedStorage.CodexAutopilot.Manifests',
  plans: 'ReplicatedStorage.CodexAutopilot.Plans',
  rounds: 'ReplicatedStorage.CodexAutopilot.Rounds',
  evidence: 'ReplicatedStorage.CodexAutopilot.Evidence',
  issues: 'ReplicatedStorage.CodexAutopilot.Issues',
  fixPlans: 'ReplicatedStorage.CodexAutopilot.FixPlans',
  reports: 'ReplicatedStorage.CodexAutopilot.Reports',
  scoreHistory: 'ReplicatedStorage.CodexAutopilot.ScoreHistory',
  premiumMirror: 'ReplicatedStorage.CodexPremiumDirector.Autopilot',
};

const CAPABILITIES = [
  'boundedProductionLoops',
  'specialistRouting',
  'evidenceCollection',
  'visualCritiqueIntegration',
  'qaSwarmIntegration',
  'worldgenIntegration',
  'assetforgeIntegration',
  'cinematicIntegration',
  'premiumIntegration',
  'safeFixPlanning',
  'codexOwnedMutationOnly',
  'manualRequiredEscalation',
  'scoreAggregation',
  'stopConditions',
  'finalReports',
];

const INTEGRATIONS = {
  premiumDirector: true,
  visualCritic: true,
  worldgen: true,
  assetforge: true,
  cinematic: true,
  qaSwarm: true,
  buildDirector: true,
  vfx: true,
  audio: true,
  animation: true,
  cameraScreen: true,
  testPilot: true,
  outputDiagnostics: true,
  pluginBundle: true,
};

const DEFAULT_POLICY = {
  maxRounds: 3,
  maxMutationsPerRound: 12,
  maxRuntimeMs: 180000,
  stopOnBlocker: true,
  requireEvidenceBeforeFix: true,
  onlyCodexOwnedMutations: true,
  targetScore: 88,
};

const POLICY_IDS = [
  'safePreview',
  'buildAndCritique',
  'polishOnly',
  'launchReadiness',
  'fullPremiumLoop',
  'regressionOnly',
  'mobilePerformance',
  'visualPolish',
  'combatFeelPolish',
];

const PHASES = [
  'preflight',
  'baseline evidence',
  'production planning',
  'build/generate',
  'visual critique',
  'QA swarm',
  'issue normalization',
  'safe fix planning',
  'safe apply or manualRequired',
  'polish',
  'retest',
  'score aggregation',
  'stop/continue decision',
  'final report',
];

const EVIDENCE_SOURCES = [
  'pluginHealth',
  'connectionPlaceStatus',
  'outputErrors',
  'premiumScore',
  'visualCritique',
  'worldgenAudit',
  'assetforgeAudit',
  'cinematicAudit',
  'qaLaunchReadiness',
  'qaIssueReport',
  'pluginBundleCheck',
  'commandHistory',
  'createdCodexPaths',
  'manualRequiredBlockers',
];

const SCORE_KEYS = [
  'premiumScore',
  'visualScore',
  'worldgenScore',
  'assetforgeScore',
  'cinematicScore',
  'qaLaunchReadiness',
  'outputCleanliness',
  'pluginHealth',
  'safetyCompliance',
  'manualRequiredLoad',
  'issueSeverity',
];

const FIX_STAGES = [
  'blocker triage',
  'Codex-owned layout fixes',
  'Codex-owned asset/socket fixes',
  'Codex-owned visual polish',
  'Codex-owned cinematic polish',
  'Codex-owned QA marker/harness fixes',
  'code/output fix suggestions',
  'manualRequired escalations',
  'validation commands',
];

function nowIso() {
  return new Date().toISOString();
}

function safeGoal(goal = 'premium Roblox production loop') {
  return String(goal || 'premium Roblox production loop').trim().replace(/\s+/g, ' ').slice(0, 240) || 'premium Roblox production loop';
}

function goalId(goal = 'autopilot') {
  return safeGoal(goal)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60) || 'autopilot';
}

function hashGoal(goal = '') {
  let hash = 5381;
  for (const ch of safeGoal(goal)) hash = ((hash * 33) ^ ch.charCodeAt(0)) >>> 0;
  return hash.toString(16).padStart(8, '0');
}

module.exports = {
  CAPABILITIES,
  DEFAULT_POLICY,
  EVIDENCE_SOURCES,
  FIX_STAGES,
  INTEGRATIONS,
  PHASES,
  POLICY_IDS,
  ROOTS,
  SCORE_KEYS,
  VERSION,
  goalId,
  hashGoal,
  nowIso,
  safeGoal,
};
