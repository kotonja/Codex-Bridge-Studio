'use strict';

const { normalizeIssues } = require('./issue-normalizer');
const { SAFETY, STAGES, base, safeGoal } = require('./schema');

function commandFor(type, goal) {
  if (type === 'architecture') return `tools\\bridge.cmd architecture polish "${goal}"`;
  if (type === 'detail') return `tools\\bridge.cmd detail polish "${goal}"`;
  if (type === 'materials') return `tools\\bridge.cmd materials polish "${goal}"`;
  return `tools\\bridge.cmd execute preview "${goal} polish pass"`;
}

function createPolishPlan(goal, options = {}) {
  const cleanGoal = safeGoal(goal);
  const issueReport = options.issueReport || normalizeIssues(cleanGoal, options);
  const safeIssues = issueReport.issues.filter((entry) => !entry.manualRequired && entry.safeToAutoPreview);
  const manualRequired = issueReport.issues.filter((entry) => entry.manualRequired || entry.safeFixType === 'manualRequired');
  const grouped = new Map();
  for (const entry of safeIssues) {
    const type = entry.safeFixType || 'execution';
    if (!grouped.has(type)) grouped.set(type, []);
    grouped.get(type).push(entry);
  }
  const actions = Array.from(grouped.entries()).map(([type, issues], index) => ({
    id: `polish_action_${index + 1}_${type}`,
    stage: STAGES[Math.min(index + 1, STAGES.length - 3)],
    issueIds: issues.map((entry) => entry.id),
    command: commandFor(type, cleanGoal),
    targetRoot: type === 'architecture' ? 'Workspace.CodexProduction.Architecture'
      : type === 'detail' ? 'Workspace.CodexProduction.DetailCompiler'
        : type === 'materials' ? 'Workspace.CodexProduction.MaterialRealization'
          : 'Workspace.CodexAutopilot',
    expectedScoreImpact: Math.min(12, 3 + issues.length * 2),
    safety: SAFETY,
    executionRequired: true,
    manualRequired: false,
    validationCommand: `tools\\bridge.cmd polish rescore "${cleanGoal}"`,
  }));
  const plan = base({
    goal: cleanGoal,
    planId: `plan_${issueReport.baselineId || 'current'}`,
    stages: STAGES.map((stage, index) => ({ index: index + 1, stage })),
    issues: issueReport.issues,
    actions,
    safeActionCount: actions.length,
    manualRequired,
    manualRequiredCount: manualRequired.length,
    approvalRequired: true,
    executionRequiresV72: true,
    warnings: issueReport.warnings || [],
    blockers: issueReport.blockers || [],
    nextCommand: `tools\\bridge.cmd polish preview "${cleanGoal}"`,
  });
  return plan;
}

module.exports = {
  createPolishPlan,
};
