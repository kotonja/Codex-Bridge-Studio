'use strict';

const { goalId, hashGoal, safeGoal } = require('./schema');

function classifyGoal(goal) {
  const q = safeGoal(goal).toLowerCase();
  if (/(regression|nothing broke|after patch)/.test(q)) return 'regression';
  if (/(launch|publish|ready)/.test(q)) return 'qaLaunch';
  if (/(visual|polish|looks|lighting|screenshot)/.test(q)) return 'visualPolish';
  if (/(cinematic|combat feel|gamefeel|impact|sync|boss intro)/.test(q)) return 'cinematicMoment';
  if (/(asset|prop|mesh|material|kit)/.test(q)) return 'assetKit';
  if (/(map|world|layout|dungeon|arena|hub|lobby)/.test(q)) return 'world';
  if (/(bug|fix|issue|error)/.test(q)) return 'bugFix';
  return 'wholeGame';
}

function policyForGoal(goal) {
  const q = safeGoal(goal).toLowerCase();
  if (/(preview|plan only|read only)/.test(q)) return 'safePreview';
  if (/(regression|nothing broke)/.test(q)) return 'regressionOnly';
  if (/(mobile|performance|low end)/.test(q)) return 'mobilePerformance';
  if (/(visual|lighting|looks|polish)/.test(q)) return 'visualPolish';
  if (/(combat feel|gamefeel|cinematic|impact|sync)/.test(q)) return 'combatFeelPolish';
  if (/(launch|publish|ready)/.test(q)) return 'launchReadiness';
  if (/(build|generate|make|create)/.test(q)) return 'buildAndCritique';
  return 'fullPremiumLoop';
}

function parseGoal(goal) {
  const clean = safeGoal(goal);
  return {
    goal: clean,
    goalClass: classifyGoal(clean),
    policyId: policyForGoal(clean),
    autopilotId: `autopilot_${goalId(clean)}_${hashGoal(clean).slice(0, 6)}`,
    roundId: `round_${goalId(clean)}_${hashGoal(`${clean}:round`).slice(0, 6)}`,
  };
}

module.exports = { classifyGoal, parseGoal, policyForGoal };
