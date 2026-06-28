'use strict';

function evaluateStopConditions({ policy = {}, roundIndex = 0, elapsedMs = 0, blockers = [], scoreHistory = [], currentScore = 0, targetScore = null, studioStale = false, pluginVersionMismatch = false, userStopped = false } = {}) {
  const target = targetScore || policy.targetScore || 88;
  const previousScores = scoreHistory.slice(-2);
  const noImprovement = previousScores.length >= 2 && currentScore <= previousScores[0] && currentScore <= previousScores[1];
  let reason = null;
  if (userStopped) reason = 'userStop';
  else if (studioStale) reason = 'staleStudio';
  else if (pluginVersionMismatch) reason = 'pluginVersionMismatch';
  else if (roundIndex >= (policy.maxRounds || 3)) reason = 'maxRounds reached';
  else if (elapsedMs >= (policy.maxRuntimeMs || 180000)) reason = 'maxRuntimeMs reached';
  else if (blockers.some((b) => b.safety === 'manualRequired' || b.severity === 'blocker')) reason = 'blocker requires manualRequired';
  else if (currentScore >= target) reason = 'targetScore reached';
  else if (noImprovement) reason = 'no score improvement after two rounds';
  return {
    shouldStop: Boolean(reason),
    reason: reason || 'continue',
    scoreDelta: scoreHistory.length ? currentScore - scoreHistory[scoreHistory.length - 1] : 0,
    roundsCompleted: roundIndex,
    nextCommand: reason ? 'tools\\bridge.cmd autopilot report "<goal>"' : 'tools\\bridge.cmd autopilot round "<goal>"',
  };
}

module.exports = { evaluateStopConditions };
