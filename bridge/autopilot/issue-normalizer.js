'use strict';

const { VERSION, nowIso, goalId } = require('./schema');
const { parseGoal } = require('./goal-parser');

const BASE_ISSUES = [
  ['visual', 'medium', 'visualReadability', 'Visual proof is structured, not pixel-verified', 'Run visual evidence/critique and collect screenshot pixels when Roblox supports it.', 'tools\\bridge.cmd visual critique "<goal>"', false, 'readOnly'],
  ['fidelity', 'medium', 'referenceFidelity', 'Reference fidelity gaps may remain after generated build', 'Compare the generated scene against reference/profile evidence and feed safe gaps into V72 fixes.', 'tools\\bridge.cmd fidelity gaps "<goal>"', false, 'readOnly'],
  ['qa', 'medium', 'launchReadiness', 'Launch readiness needs live Play/Test evidence', 'Run QA launch after Play/Test snapshot and fresh Output baseline.', 'tools\\bridge.cmd qa launch "<goal>"', false, 'readOnly'],
  ['worldgen', 'low', 'routeFlow', 'World route polish may be needed', 'Audit and polish Codex-owned worldgen routes.', 'tools\\bridge.cmd worldgen polish "<goal>"', true, 'codexOwnedMutation'],
  ['assetforge', 'low', 'assetDensity', 'Reusable asset kit may need polish', 'Polish Codex-owned asset kit/socket details.', 'tools\\bridge.cmd assetforge polish "<goal>"', true, 'codexOwnedMutation'],
  ['cinematic', 'low', 'gameFeel', 'Cinematic beat may need impact polish', 'Polish Codex-owned cinematic manifest timing.', 'tools\\bridge.cmd cinematic polish "<goal>"', true, 'codexOwnedMutation'],
  ['plugin', 'low', 'health', 'Keep plugin bundle and loaded Studio version aligned', 'Run plugin-health before applying generated fixes.', 'tools\\bridge.cmd plugin-health', false, 'readOnly'],
];

function normalizeIssue(goal, tuple, index) {
  const [source, severity, category, title, exactFix, command, safeToAutoApply, safety] = tuple;
  const cleanGoal = parseGoal(goal).goal;
  return {
    id: `${source}_${category}_${goalId(cleanGoal)}_${index + 1}`,
    source,
    severity,
    category,
    title,
    evidence: [`${source} evidence source for "${cleanGoal}"`],
    createdBy: 'V70AutopilotIssueNormalizer',
    affectedPaths: safeToAutoApply ? ['ReplicatedStorage.CodexAutopilot', 'Workspace.CodexAutopilot'] : [],
    exactFix,
    suggestedCommand: command.replace('<goal>', cleanGoal),
    safeToAutoApply,
    safety,
  };
}

function createIssueReport(goal, options = {}) {
  const parsed = parseGoal(goal);
  const issues = (options.issues || BASE_ISSUES).map((issue, index) => normalizeIssue(parsed.goal, issue, index));
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: parsed.goal,
    autopilotId: parsed.autopilotId,
    issues,
    counts: issues.reduce((acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
      return acc;
    }, {}),
    warnings: [],
    blockers: issues.filter((issue) => issue.severity === 'blocker'),
    nextCommand: `tools\\bridge.cmd autopilot fix-plan "${parsed.goal}"`,
  };
}

module.exports = { createIssueReport, normalizeIssue };
