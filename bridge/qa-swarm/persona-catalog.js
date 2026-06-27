'use strict';

const { PERSONA_IDS, VERSION } = require('./schema');

const personaFocus = {
  firstTimePlayer: ['objective clarity', 'spawn readability', 'first reward'],
  impatientMobilePlayer: ['fast CTA discovery', 'tap target size', 'short pathing'],
  lowEndDevicePlayer: ['particle density', 'light count', 'mobile fallback'],
  speedrunner: ['route reliability', 'collision snagging', 'skip exploits'],
  completionist: ['content completeness', 'quest clarity', 'reward replay'],
  uiSpamClicker: ['debounce', 'disabled states', 'close button reliability'],
  promptExplorer: ['prompt distance', 'ownership', 'interactable affordance'],
  combatButtonMasher: ['input response', 'cooldown feedback', 'hit confirmation'],
  cautiousNewbie: ['safety/readability', 'clear fail states', 'gentle onboarding'],
  economyOptimizer: ['reward timing', 'prices', 'loop clarity'],
  rewardHunter: ['reward feedback', 'claim flow', 'replay motivation'],
  multiplayerJoiner: ['spawn separation', 'replication sanity', 'shared object clarity'],
  laggyNetworkPlayer: ['retry clarity', 'late replication', 'output warnings'],
  accessibilityReader: ['text size', 'contrast', 'color-only signals'],
  cinematicSkipper: ['skip safety', 'camera release', 'control return'],
  regressionHunter: ['fresh output baseline', 'changed paths', 'issue fingerprints'],
  exploitBoundaryTester: ['unsafe remotes', 'purchase guards', 'data mutation blockers'],
  premiumVibeChecker: ['polish feel', 'visual/audio sync', 'top-dev presentation'],
};

function makePersona(id, index) {
  const focus = personaFocus[id] || ['general QA'];
  return {
    id,
    version: VERSION,
    goal: `Stress ${focus[0]} from a ${id} perspective.`,
    mindset: id === 'impatientMobilePlayer' ? 'rushes, taps quickly, and abandons unclear goals' : id === 'premiumVibeChecker' ? 'expects reference-quality polish and obvious delight' : 'tests with focused skepticism',
    explorationStrategy: index % 3 === 0 ? 'follow primary affordances first, then branch' : index % 3 === 1 ? 'probe side paths and UI before the main route' : 'repeat core loop and compare before/after evidence',
    interactionHabit: id.includes('Spam') ? 'rapid repeated clicks with debounce checks' : id.includes('combat') ? 'frequent ability input and target switching' : 'bounded observe/move/click/prompt actions',
    likelyFinds: focus,
    deviceAssumption: id.includes('Mobile') || id === 'lowEndDevicePlayer' ? 'phone portrait / low-end mobile budget' : id === 'multiplayerJoiner' ? 'local multiplayer session' : 'desktop editor/playtest',
    failureSignals: ['unclear next objective', 'fresh Output error', 'stuck route', 'missing feedback'],
    testFocus: focus,
    forbiddenActions: ['purchase', 'publish', 'delete', 'saveData', 'externalUpload', 'monetizationChange'],
    maxActions: id === 'speedrunner' ? 60 : id === 'uiSpamClicker' ? 80 : 40,
    evidenceNeeded: ['watch snapshot', 'Output since baseline', 'before/after UI or world diff'],
  };
}

function getPersonaCatalog() {
  return PERSONA_IDS.map(makePersona);
}

module.exports = { getPersonaCatalog };
