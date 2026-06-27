'use strict';

const { VERSION, nowIso } = require('./schema');
const { parseGoal } = require('./goal-parser');
const { createLaunchSubScores, ratingForScore } = require('./scorecard');

function createLaunchReadinessReport(goal) {
  const parsed = parseGoal(goal);
  const subScores = createLaunchSubScores(parsed.goal);
  const values = Object.values(subScores).map((item) => item.score);
  const score = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: parsed.goal,
    qaPlanId: parsed.qaPlanId,
    launchReadinessScore: score,
    overallScore: score,
    rating: ratingForScore(score),
    subScores,
    evidence: ['QA swarm plan', 'specialist audits', 'fresh Output baseline contract'],
    warnings: ['This is a structured launch readiness plan unless live Play/Test evidence is supplied.'],
    blockers: [],
    nextCommand: `tools\\bridge.cmd qa fix-plan "${parsed.goal}"`,
  };
}

module.exports = { createLaunchReadinessReport };
