'use strict';

const { VERSION, nowIso } = require('./schema');
const { parseGoal } = require('./goal-parser');

function createIssueReport(goal) {
  const parsed = parseGoal(goal);
  const issues = [
    {
      id: 'qa_medium_onboarding_next_step',
      severity: 'medium',
      category: 'onboarding',
      title: 'First-time next action still needs live proof.',
      evidence: ['structured QA plan requires first_10_seconds scenario'],
      reproSteps: ['mark output baseline', 'start Play manually if needed', 'run first-time-player scenario'],
      expected: 'New player understands primary goal in under 10 seconds.',
      actual: 'Not yet live-verified in this report.',
      likelyCause: 'Launch readiness is plan-backed until live Play/Test evidence is attached.',
      exactFix: 'Run QA swarm in Play mode and attach watch/test snapshot evidence.',
      suggestedCommand: `tools\\bridge.cmd qa run "${parsed.goal}"`,
      safety: 'readOnly',
    },
    {
      id: 'qa_low_multiplayer_manual_required',
      severity: 'low',
      category: 'multiplayer',
      title: 'Local multiplayer smoke is manualRequired unless local players are available.',
      evidence: ['multiplayer plan is bounded/local/manualRequired by default'],
      reproSteps: ['open local multiplayer test context', 'rerun qa multiplayer'],
      expected: 'Spawn/replication checks use bounded local players.',
      actual: 'No players are faked by V69.',
      likelyCause: 'Studio multiplayer API availability is context-dependent.',
      exactFix: 'Run local multiplayer when Studio exposes safe local players.',
      suggestedCommand: `tools\\bridge.cmd qa multiplayer "${parsed.goal}"`,
      safety: 'manualRequired',
    },
  ];
  return { ok: true, version: VERSION, at: nowIso(), goal: parsed.goal, issues, warnings: [], blockers: [], nextCommand: `tools\\bridge.cmd qa fix-plan "${parsed.goal}"` };
}

module.exports = { createIssueReport };
