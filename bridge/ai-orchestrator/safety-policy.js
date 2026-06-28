'use strict';

const BLOCKED = /\b(publish|upload|marketplace|buy asset|purchase|datastore|data store|economy|monetization|developer product|game pass|wipe|delete all|broad delete)\b/i;

function classifyGoal(goal = '') {
  const text = String(goal || '');
  const blocked = BLOCKED.test(text);
  return {
    ok: !blocked,
    externalRisk: blocked,
    warnings: [],
    blockers: blocked ? ['External/account-level or destructive risk detected; AI orchestrator will not run this automatically.'] : [],
  };
}

function canMutate(run = {}) {
  return Array.isArray(run.approvals) && run.approvals.some((approval) => approval.type === 'mutation' && approval.status === 'approved');
}

module.exports = {
  canMutate,
  classifyGoal,
};
