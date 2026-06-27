'use strict';

const { VERSION, nowIso } = require('./schema');
const { parseGoal } = require('./goal-parser');

function createRegressionPlan(goal) {
  const parsed = parseGoal(goal);
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: parsed.goal,
    uses: {
      outputBaseline: true,
      recentCommandHistory: true,
      premiumManifestReferences: true,
      worldgenManifestReferences: true,
      assetforgeManifestReferences: true,
      visualManifestReferences: true,
      cinematicManifestReferences: true,
      changedPaths: true,
      createdCodexRoots: true,
      knownBlockers: true,
      issueFingerprints: true,
      duplicateStaleCommandDetection: true,
    },
    steps: [
      { id: 'mark_baseline', command: 'tools\\bridge.cmd baseline mark' },
      { id: 'fresh_output', command: 'tools\\bridge.cmd output errors' },
      { id: 'manifest_crosscheck', command: `tools\\bridge.cmd qa manifest "${parsed.goal}"` },
      { id: 'issue_fingerprint', command: `tools\\bridge.cmd qa report "${parsed.goal}"` },
    ],
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd qa accessibility "${parsed.goal}"`,
  };
}

module.exports = { createRegressionPlan };
