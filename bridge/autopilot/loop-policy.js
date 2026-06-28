'use strict';

const { DEFAULT_POLICY, POLICY_IDS, VERSION, nowIso } = require('./schema');

const POLICY_OVERRIDES = {
  safePreview: { maxRounds: 1, maxMutationsPerRound: 0, maxRuntimeMs: 45000, allowedSpecialists: ['premium', 'visual', 'qa'], allowedMutationScopes: [] },
  buildAndCritique: { maxRounds: 2, maxMutationsPerRound: 8, maxRuntimeMs: 120000, allowedSpecialists: ['premium', 'worldgen', 'assetforge', 'visual', 'qa'], allowedMutationScopes: ['Workspace.Codex*', 'ReplicatedStorage.Codex*'] },
  polishOnly: { maxRounds: 2, maxMutationsPerRound: 6, maxRuntimeMs: 90000, allowedSpecialists: ['visual', 'assetforge', 'worldgen', 'cinematic', 'qa'], allowedMutationScopes: ['Workspace.Codex*', 'ReplicatedStorage.Codex*'] },
  launchReadiness: { maxRounds: 2, maxMutationsPerRound: 5, maxRuntimeMs: 120000, allowedSpecialists: ['qa', 'visual', 'premium', 'pluginHealth'], allowedMutationScopes: ['ReplicatedStorage.Codex*'] },
  fullPremiumLoop: { maxRounds: 3, maxMutationsPerRound: 12, maxRuntimeMs: 180000, allowedSpecialists: ['premium', 'worldgen', 'assetforge', 'visual', 'cinematic', 'qa', 'testPilot', 'output'], allowedMutationScopes: ['Workspace.Codex*', 'ReplicatedStorage.Codex*', 'StarterGui.Codex*'] },
  regressionOnly: { maxRounds: 1, maxMutationsPerRound: 3, maxRuntimeMs: 60000, allowedSpecialists: ['qa', 'output', 'pluginHealth'], allowedMutationScopes: ['ReplicatedStorage.Codex*'] },
  mobilePerformance: { maxRounds: 2, maxMutationsPerRound: 4, maxRuntimeMs: 90000, allowedSpecialists: ['qa', 'visual', 'assetforge', 'worldgen'], allowedMutationScopes: ['Workspace.Codex*', 'ReplicatedStorage.Codex*'] },
  visualPolish: { maxRounds: 2, maxMutationsPerRound: 6, maxRuntimeMs: 90000, allowedSpecialists: ['visual', 'assetforge', 'worldgen', 'vfx'], allowedMutationScopes: ['Workspace.Codex*', 'ReplicatedStorage.Codex*'] },
  combatFeelPolish: { maxRounds: 2, maxMutationsPerRound: 6, maxRuntimeMs: 90000, allowedSpecialists: ['cinematic', 'vfx', 'animation', 'audio', 'qa'], allowedMutationScopes: ['Workspace.Codex*', 'ReplicatedStorage.Codex*'] },
};

function createPolicy(id = 'fullPremiumLoop') {
  const policyId = POLICY_IDS.includes(id) ? id : 'fullPremiumLoop';
  const override = POLICY_OVERRIDES[policyId] || {};
  return {
    id: policyId,
    version: VERSION,
    at: nowIso(),
    ...DEFAULT_POLICY,
    requiredEvidence: ['pluginHealth', 'connectionPlaceStatus', 'outputErrors', 'visualCritique', 'qaLaunchReadiness'],
    blockedActions: ['publish', 'upload', 'marketplacePurchase', 'monetizationChange', 'DataStoreMutation', 'economyMutation', 'broadDelete', 'nonCodexDestructiveEdit'],
    stopConditions: ['maxRounds', 'maxRuntimeMs', 'manualRequiredBlocker', 'safetyViolation', 'noImprovementAfterTwoRounds', 'targetScoreReached', 'launchCandidateReached', 'userStop', 'staleStudio', 'pluginVersionMismatch'],
    escalationRules: ['external account actions become manualRequired', 'non-Codex gameplay script fixes require hash-backed patch flow and explicit evidence', 'missing live evidence stays unavailable instead of fabricated'],
    ...override,
  };
}

function listPolicies() {
  return POLICY_IDS.map(createPolicy);
}

module.exports = { createPolicy, listPolicies };
