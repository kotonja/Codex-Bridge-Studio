'use strict';

const { VERSION, SCORE_KEYS, nowIso, safeGoal } = require('./schema');

function scoreOf(report, key) {
  return report && report.subScores && report.subScores[key] ? Number(report.subScores[key].score || 0) : 0;
}

function createVisualCompareReport(reportA, reportB, options = {}) {
  const a = reportA || {};
  const b = reportB || {};
  const goal = safeGoal(options.goal || b.goal || a.goal || 'visual comparison');
  const before = Number(a.overallScore ?? a.score ?? 0);
  const after = Number(b.overallScore ?? b.score ?? 0);
  const improvedCategories = [];
  const worsenedCategories = [];
  for (const key of SCORE_KEYS) {
    const delta = scoreOf(b, key) - scoreOf(a, key);
    if (delta > 0) improvedCategories.push({ key, delta });
    if (delta < 0) worsenedCategories.push({ key, delta });
  }
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal,
    scoreDelta: after - before,
    beforeScore: before,
    afterScore: after,
    improvedCategories,
    worsenedCategories,
    remainingBlockers: [...(b.blockers || []), ...(Array.isArray(b.topProblems) ? b.topProblems.filter((p) => p.severity === 'blocker') : [])],
    nextPolishCommand: `tools\\bridge.cmd visual polish "${goal}"`,
    nextCommand: `tools\\bridge.cmd visual polish "${goal}"`,
  };
}

module.exports = { createVisualCompareReport };
