'use strict';

const { SCORE_KEYS, VERSION, nowIso } = require('./schema');
const { parseGoal } = require('./goal-parser');
const { createIssueReport } = require('./issue-normalizer');

function ratingForScore(score, blockerCount = 0) {
  if (blockerCount > 0) return 'blocked';
  if (score < 45) return 'unstable';
  if (score < 60) return 'prototype';
  if (score < 72) return 'playable';
  if (score < 82) return 'polished';
  if (score < 88) return 'premiumCandidate';
  if (score < 94) return 'launchCandidate';
  return 'premiumLaunchCandidate';
}

function createSubScores(goal) {
  const q = parseGoal(goal).goal.toLowerCase();
  const premiumBoost = q.includes('premium') ? 3 : 0;
  return {
    premiumScore: 80 + premiumBoost,
    visualScore: 72 + premiumBoost,
    worldgenScore: 82,
    assetforgeScore: 83,
    cinematicScore: 81,
    qaLaunchReadiness: 80,
    outputCleanliness: 86,
    pluginHealth: 92,
    safetyCompliance: 100,
    manualRequiredLoad: 76,
    issueSeverity: 78,
  };
}

function createScoreReport(goal, options = {}) {
  const parsed = parseGoal(goal);
  const subScores = { ...createSubScores(parsed.goal), ...(options.subScores || {}) };
  const values = SCORE_KEYS.map((key) => Number(subScores[key] ?? 75));
  const score = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  const issues = createIssueReport(parsed.goal).issues;
  const blockerCount = issues.filter((issue) => issue.severity === 'blocker').length;
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: parsed.goal,
    autopilotId: parsed.autopilotId,
    overallScore: score,
    finalScore: score,
    rating: ratingForScore(score, blockerCount),
    subScores,
    scoreKeys: SCORE_KEYS,
    unresolvedIssueCount: issues.length,
    blockerCount,
    manualRequiredCount: issues.filter((issue) => issue.safety === 'manualRequired').length,
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd autopilot report "${parsed.goal}"`,
  };
}

module.exports = { createScoreReport, ratingForScore };
