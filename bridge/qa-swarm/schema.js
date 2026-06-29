'use strict';

const VERSION = '0.74.0';

const ROOTS = {
  replicatedStorage: 'ReplicatedStorage.CodexQaSwarm',
  workspace: 'Workspace.CodexQaSwarm',
  premiumMirror: 'ReplicatedStorage.CodexPremiumDirector.QaSwarm',
  worldgenRoutes: 'ReplicatedStorage.CodexWorldgen.QaRoutes',
  cinematicQa: 'ReplicatedStorage.CodexCinematicDirector.Qa',
};

const CAPABILITIES = [
  'personaCatalog',
  'swarmPlanning',
  'routeTesting',
  'uiActionTesting',
  'promptInteractionTesting',
  'combatTesting',
  'cinematicMomentTesting',
  'economyLoopAuditing',
  'multiplayerLocalPlan',
  'performanceProbes',
  'regressionOutputScan',
  'accessibilityAudit',
  'launchReadinessScoring',
  'premiumIntegration',
  'worldgenIntegration',
  'assetforgeIntegration',
  'visualIntegration',
  'cinematicIntegration',
];

const PERSONA_IDS = [
  'firstTimePlayer',
  'impatientMobilePlayer',
  'lowEndDevicePlayer',
  'speedrunner',
  'completionist',
  'uiSpamClicker',
  'promptExplorer',
  'combatButtonMasher',
  'cautiousNewbie',
  'economyOptimizer',
  'rewardHunter',
  'multiplayerJoiner',
  'laggyNetworkPlayer',
  'accessibilityReader',
  'cinematicSkipper',
  'regressionHunter',
  'exploitBoundaryTester',
  'premiumVibeChecker',
];

const SCENARIO_IDS = [
  'first_10_seconds',
  'first_reward',
  'spawn_to_primary_goal',
  'shop_open_close',
  'quest_accept_complete',
  'portal_select_enter',
  'training_interaction',
  'combat_basic_attack',
  'cinematic_moment_preview',
  'ability_use_once',
  'death_respawn',
  'reward_replay_loop',
  'mobile_readability',
  'low_end_performance_sweep',
  'ui_spam_safe',
  'prompt_interaction_sweep',
  'route_collision_sweep',
  'multiplayer_join_smoke',
  'output_regression_scan',
  'accessibility_text_readability',
  'premium_vibe_review',
];

const ROUTE_IDS = [
  'spawn_to_primary_goal',
  'spawn_to_shop',
  'spawn_to_quest',
  'spawn_to_portal',
  'spawn_to_training',
  'full_loop',
  'mobile_readability_walk',
  'clutter_collision_sweep',
  'cinematic_view_route',
];

const UI_CHECKS = [
  'visible primary CTA',
  'shop button',
  'quest button',
  'portal selection',
  'close buttons',
  'reward claim',
  'settings/menu',
  'mobile safe zone',
  'text truncation',
  'spam click safety',
  'disabled state clarity',
];

const COMBAT_CHECKS = [
  'input response',
  'ability cooldown',
  'damage/contact window',
  'hit feedback',
  'camera shake comfort',
  'VFX/audio sync',
  'enemy target feedback',
  'death/respawn',
  'no output errors',
  'mobile control readability',
];

const ECONOMY_CHECKS = [
  'reward loop clarity',
  'currency display',
  'reward timing',
  'shop price readability',
  'no accidental purchase',
  'no DataStore mutation',
  'no monetization flow auto-run',
  'balance sanity warnings',
];

const ACCESSIBILITY_CHECKS = [
  'text size',
  'contrast intent',
  'motion comfort',
  'camera shake reduction',
  'clear objectives',
  'no tiny click targets',
  'mobile reachability',
  'color-only signaling risks',
  'visual clutter',
  'audio-only feedback risks',
];

const LAUNCH_SCORE_KEYS = [
  'onboardingClarity',
  'firstTenSecondReadability',
  'routeReliability',
  'uiReliability',
  'interactionReliability',
  'combatReliability',
  'cinematicReliability',
  'rewardLoopClarity',
  'economySafety',
  'multiplayerReadiness',
  'performanceSafety',
  'mobileReadiness',
  'accessibilityComfort',
  'outputCleanliness',
  'regressionRisk',
  'premiumFeelValidation',
  'contentCompleteness',
  'maintainability',
  'safetyCompliance',
];

const FIX_STAGES = [
  'blockers first',
  'first-time-player clarity',
  'route/interactability',
  'UI reliability',
  'combat/cinematic feel',
  'performance/mobile',
  'accessibility',
  'final regression',
  'final visual/premium pass',
];

function nowIso() {
  return new Date().toISOString();
}

function safeGoal(goal = 'premium Roblox launch QA') {
  return String(goal || 'premium Roblox launch QA').trim().replace(/\s+/g, ' ').slice(0, 220) || 'premium Roblox launch QA';
}

function goalId(goal = 'qa swarm') {
  return safeGoal(goal)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 58) || 'qa_swarm';
}

function hashGoal(goal = '') {
  let hash = 0;
  for (const ch of safeGoal(goal)) hash = ((hash * 33) + ch.charCodeAt(0)) >>> 0;
  return hash.toString(16).padStart(8, '0');
}

module.exports = {
  ACCESSIBILITY_CHECKS,
  CAPABILITIES,
  COMBAT_CHECKS,
  ECONOMY_CHECKS,
  FIX_STAGES,
  LAUNCH_SCORE_KEYS,
  PERSONA_IDS,
  ROOTS,
  ROUTE_IDS,
  SCENARIO_IDS,
  UI_CHECKS,
  VERSION,
  goalId,
  hashGoal,
  nowIso,
  safeGoal,
};
