'use strict';

function numberOrNull(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function scoreFrom(report = {}) {
  const candidates = [
    report.overallScore,
    report.score,
    report.finalScore,
    report.launchReadinessScore,
    report.scores && report.scores.overall,
    report.scores && report.scores.fidelity,
    report.scores && report.scores.total,
  ];
  for (const value of candidates) {
    const num = numberOrNull(value);
    if (num !== null) return Math.round(num);
  }
  return null;
}

function computeScoreDelta(baselineReport = {}, afterReport = {}) {
  const baselineScore = scoreFrom(baselineReport);
  const afterScore = scoreFrom(afterReport);
  const scoreDelta = baselineScore === null || afterScore === null ? null : Math.round(afterScore - baselineScore);
  let status = 'unknown';
  if (scoreDelta !== null) {
    if (scoreDelta > 0) status = 'improved';
    else if (scoreDelta < 0) status = 'regressed';
    else status = 'unchanged';
  }
  return {
    baselineScore,
    afterScore,
    scoreDelta,
    status,
  };
}

module.exports = {
  computeScoreDelta,
  scoreFrom,
};
