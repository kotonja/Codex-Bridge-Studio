'use strict';

const { goalId, hashGoal, safeGoal } = require('./schema');

function parseGoal(goal = 'premium Roblox launch QA') {
  const text = safeGoal(goal);
  const q = text.toLowerCase();
  let scope = 'fullLaunch';
  if (q.includes('smoke')) scope = 'smoke';
  else if (q.includes('regression') || q.includes('nothing broke')) scope = 'regression';
  else if (q.includes('performance') || q.includes('low-end')) scope = 'performance';
  else if (q.includes('mobile')) scope = 'mobile';
  else if (q.includes('combat')) scope = 'combat';
  else if (q.includes('economy') || q.includes('reward')) scope = 'economy';
  else if (q.includes('multiplayer')) scope = 'multiplayer';
  else if (q.includes('feature')) scope = 'feature';

  const riskAreas = [];
  for (const [word, risk] of [
    ['mobile', 'mobile readability'],
    ['combat', 'combat feel'],
    ['economy', 'economy safety'],
    ['multiplayer', 'replication'],
    ['premium', 'premium feel'],
    ['launch', 'launch readiness'],
    ['bug', 'regression/output'],
  ]) {
    if (q.includes(word)) riskAreas.push(risk);
  }
  if (!riskAreas.length) riskAreas.push('onboarding clarity', 'route reliability', 'output cleanliness');

  return {
    goal: text,
    qaPlanId: `qa_${goalId(text)}_${hashGoal(text).slice(0, 6)}`,
    swarmId: `swarm_${goalId(text)}_${hashGoal(text).slice(0, 6)}`,
    runId: `qarun_${goalId(text)}_${hashGoal(text).slice(0, 6)}`,
    scope,
    targetPlace: q.includes('hub') ? 'active hub/place' : q.includes('arena') ? 'active arena/place' : 'active Studio place',
    riskAreas,
  };
}

module.exports = { parseGoal };
