'use strict';

const Store = require('./manifest-store');
const { SCORE_KEYS, base, safeGoal } = require('./schema');

function createDelta(goal, options = {}) {
  const cleanGoal = safeGoal(goal);
  const baseline = options.baseline || Store.readBaseline(cleanGoal);
  const after = options.after || Store.readRescore(cleanGoal);
  const warnings = [];
  if (!baseline) warnings.push('No stored V96 baseline found; run polish baseline first.');
  if (!after) warnings.push('No stored V96 rescore found; run polish rescore after preview/apply.');
  const beforeScores = (baseline && baseline.scores) || {};
  const afterScores = (after && after.scores) || beforeScores;
  const deltas = {};
  const improved = [];
  const regressed = [];
  const unchanged = [];
  for (const key of SCORE_KEYS) {
    const before = Number(beforeScores[key]);
    const next = Number(afterScores[key]);
    const delta = Number.isFinite(before) && Number.isFinite(next) ? Math.round(next - before) : null;
    deltas[key] = delta;
    if (delta === null || delta === 0) unchanged.push(key);
    else if (delta > 0) improved.push(key);
    else regressed.push(key);
  }
  return base({
    goal: cleanGoal,
    baseline: baseline ? { baselineId: baseline.baselineId, scores: baseline.scores, at: baseline.at } : null,
    after: after ? { rescoreId: after.rescoreId, scores: after.scores, at: after.at } : null,
    deltas,
    improved,
    regressed,
    unchanged,
    warnings,
    blockers: [],
    nextCommand: `tools\\bridge.cmd polish learn "${cleanGoal}"`,
  });
}

module.exports = { createDelta };
