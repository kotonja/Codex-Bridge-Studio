'use strict';

const { SCENARIO_IDS, VERSION } = require('./schema');

const personaMap = {
  first_10_seconds: ['firstTimePlayer', 'cautiousNewbie'],
  first_reward: ['rewardHunter', 'firstTimePlayer'],
  spawn_to_primary_goal: ['firstTimePlayer', 'speedrunner'],
  shop_open_close: ['uiSpamClicker', 'economyOptimizer'],
  quest_accept_complete: ['completionist', 'cautiousNewbie'],
  portal_select_enter: ['promptExplorer', 'speedrunner'],
  training_interaction: ['cautiousNewbie', 'combatButtonMasher'],
  combat_basic_attack: ['combatButtonMasher', 'cinematicSkipper'],
  cinematic_moment_preview: ['premiumVibeChecker', 'cinematicSkipper'],
  ability_use_once: ['combatButtonMasher', 'premiumVibeChecker'],
  death_respawn: ['regressionHunter', 'cautiousNewbie'],
  reward_replay_loop: ['rewardHunter', 'completionist'],
  mobile_readability: ['impatientMobilePlayer', 'accessibilityReader'],
  low_end_performance_sweep: ['lowEndDevicePlayer', 'regressionHunter'],
  ui_spam_safe: ['uiSpamClicker', 'exploitBoundaryTester'],
  prompt_interaction_sweep: ['promptExplorer', 'completionist'],
  route_collision_sweep: ['speedrunner', 'lowEndDevicePlayer'],
  multiplayer_join_smoke: ['multiplayerJoiner', 'laggyNetworkPlayer'],
  output_regression_scan: ['regressionHunter', 'exploitBoundaryTester'],
  accessibility_text_readability: ['accessibilityReader', 'cautiousNewbie'],
  premium_vibe_review: ['premiumVibeChecker', 'rewardHunter'],
};

function createScenarioCatalog(goal) {
  return SCENARIO_IDS.map((id, index) => ({
    id,
    version: VERSION,
    purpose: `Verify ${id.replace(/_/g, ' ')} for ${goal}.`,
    personaIds: personaMap[id] || ['firstTimePlayer'],
    preconditions: index < 3 ? ['fresh Output baseline', 'active place connected'] : ['watch/context available', 'no stale command queue'],
    steps: ['observe', 'snapshot', 'move or inspect route', 'probe safe UI/prompt if available', 'record before/after evidence'],
    expectedObservations: ['clear objective/feedback', 'no fresh Output errors', 'bounded latency', 'no unsafe external action'],
    passCriteria: ['player understands next action', 'no blocker issue', 'evidence captured'],
    failCriteria: ['stuck route', 'ambiguous UI', 'fresh script error', 'missing feedback'],
    evidenceRequired: ['watch now', 'test snapshot', 'output current', 'issue report if failed'],
    suggestedCommands: ['tools\\bridge.cmd baseline mark', `tools\\bridge.cmd qa report "${goal}"`],
    safety: 'readOnlyOrCodexOwnedRuntimeProbe',
  }));
}

module.exports = { createScenarioCatalog };
