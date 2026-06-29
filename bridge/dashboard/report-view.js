'use strict';

const { VERSION, redact } = require('./schema');
const { summarizeTransaction } = require('./transaction-view');

function scoreFrom(result) {
  if (!result || typeof result !== 'object') return null;
  if (typeof result.overallScore === 'number') return result.overallScore;
  if (typeof result.score === 'number') return result.score;
  if (typeof result.launchReadinessScore === 'number') return result.launchReadinessScore;
  if (typeof result.finalScore === 'number') return result.finalScore;
  if (result.scores && typeof result.scores.overall === 'number') return result.scores.overall;
  if (result.qualityScore && typeof result.qualityScore.score === 'number') return result.qualityScore.score;
  if (result.autopilotScore && typeof result.autopilotScore.finalScore === 'number') return result.autopilotScore.finalScore;
  return null;
}

function createScorePanel(latest = {}) {
  return {
    visual: scoreFrom(latest.visualCritique),
    fidelity: scoreFrom(latest.fidelityCompare) || scoreFrom(latest.fidelityScore),
    qa: scoreFrom(latest.qaLaunch),
    premium: scoreFrom(latest.premiumScore),
    autopilot: scoreFrom(latest.autopilotReport) || scoreFrom(latest.autopilotScore),
    referenceFidelity: latest.fidelityCompare && latest.fidelityCompare.scores ? latest.fidelityCompare.scores.overall : null,
    playability: latest.qaLaunch && latest.qaLaunch.subScores && latest.qaLaunch.subScores.routeReliability ? latest.qaLaunch.subScores.routeReliability.score : null,
  };
}

function createReportView(state = {}) {
  const latest = state.latest || {};
  return redact({
    ok: true,
    version: VERSION,
    at: new Date().toISOString(),
    goal: latest.goal || null,
    lastCommand: latest.lastCommand || null,
    lastResult: latest.lastResult || null,
    scores: createScorePanel(latest),
    pendingApproval: state.pendingApproval || null,
    transactions: Array.isArray(latest.transactions) ? latest.transactions.slice(0, 10).map(summarizeTransaction) : [],
    warnings: latest.warnings || [],
    blockers: latest.blockers || [],
    nextCommand: latest.nextCommand || 'tools\\bridge.cmd dashboard open',
  });
}

module.exports = { createReportView, createScorePanel, scoreFrom };
