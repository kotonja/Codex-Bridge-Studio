'use strict';

const { VERSION, nowIso } = require('./schema');
const { parseGoal } = require('./goal-parser');
const { createEvidencePack } = require('./evidence-pack');
const { createIssueReport } = require('./issue-normalizer');
const { createScoreReport } = require('./score-aggregator');

function createFinalReport(goal, options = {}) {
  const parsed = parseGoal(goal);
  const score = createScoreReport(parsed.goal, options);
  const issueReport = createIssueReport(parsed.goal);
  const manualRequired = issueReport.issues.filter((issue) => issue.safety === 'manualRequired');
  return {
    version: VERSION,
    ok: true,
    at: nowIso(),
    goal: parsed.goal,
    autopilotId: parsed.autopilotId,
    status: manualRequired.length ? 'manualRequired' : 'completed',
    roundsCompleted: options.roundsCompleted || 0,
    finalScore: score.finalScore,
    rating: score.rating,
    scoreHistory: options.scoreHistory || [score.finalScore],
    improvements: options.improvements || ['Created bounded production loop plan', 'Normalized specialist issues', 'Prepared safe Codex-owned fix plan'],
    remainingIssues: issueReport.issues,
    manualRequired,
    createdPaths: options.createdPaths || [],
    changedPaths: options.changedPaths || [],
    skippedUnsafeActions: issueReport.issues.filter((issue) => !issue.safeToAutoApply),
    evidenceSummary: {
      availableCount: createEvidencePack(parsed.goal).availableCount,
      missingCount: createEvidencePack(parsed.goal).missingCount,
      note: 'Missing live evidence is not fabricated.',
    },
    nextRecommendedCommands: [
      `tools\\bridge.cmd autopilot retest "${parsed.goal}"`,
      `tools\\bridge.cmd autopilot score "${parsed.goal}"`,
      `tools\\bridge.cmd premium score "${parsed.goal}"`,
    ],
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd autopilot score "${parsed.goal}"`,
  };
}

module.exports = { createFinalReport };
