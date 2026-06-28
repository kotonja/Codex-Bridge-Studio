'use strict';

const { FIX_STAGES, VERSION, nowIso } = require('./schema');
const { parseGoal } = require('./goal-parser');
const { createPolicy } = require('./loop-policy');
const { createIssueReport } = require('./issue-normalizer');

function actionForIssue(goal, issue, index, policy) {
  const autoApplyAllowed = Boolean(issue.safeToAutoApply && issue.evidence.length && issue.affectedPaths.every((p) => /^Workspace\.Codex|^ReplicatedStorage\.Codex|^StarterGui\.Codex/.test(p)) && index < policy.maxMutationsPerRound);
  return {
    issueIds: [issue.id],
    stage: FIX_STAGES[index % FIX_STAGES.length],
    command: autoApplyAllowed ? issue.suggestedCommand : `manualRequired: ${issue.suggestedCommand}`,
    targetPaths: issue.affectedPaths,
    expectedImprovement: issue.exactFix,
    rollbackNote: 'Versioned/Codex-owned output only; use Studio undo or remove CodexAutopilot generated marker if needed.',
    validationCommand: `tools\\bridge.cmd autopilot retest "${goal}"`,
    mutationType: autoApplyAllowed ? 'codexOwnedMutation' : 'manualRequired',
    safety: autoApplyAllowed ? 'codexOwnedMutation' : issue.safety,
    autoApplyAllowed,
  };
}

function createFixPlan(goal) {
  const parsed = parseGoal(goal);
  const policy = createPolicy(parsed.policyId);
  const issues = createIssueReport(parsed.goal).issues;
  const actions = issues.map((issue, index) => actionForIssue(parsed.goal, issue, index, policy));
  for (const stage of FIX_STAGES) {
    if (!actions.some((action) => action.stage === stage)) {
      actions.push({
        issueIds: [],
        stage,
        command: stage === 'validation commands' ? `tools\\bridge.cmd autopilot retest "${parsed.goal}"` : 'manualRequired: no evidence-linked safe action for this stage yet',
        targetPaths: [],
        expectedImprovement: 'Reserved stage; no fake action emitted.',
        rollbackNote: 'No mutation.',
        validationCommand: `tools\\bridge.cmd autopilot score "${parsed.goal}"`,
        mutationType: 'none',
        safety: 'readOnly',
        autoApplyAllowed: false,
      });
    }
  }
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: parsed.goal,
    autopilotId: parsed.autopilotId,
    policyId: policy.id,
    stages: FIX_STAGES,
    actions,
    autoApplyCount: actions.filter((action) => action.autoApplyAllowed).length,
    manualRequiredActions: actions.filter((action) => action.safety === 'manualRequired' || String(action.command).startsWith('manualRequired')),
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd autopilot apply-safe "${parsed.goal}"`,
  };
}

module.exports = { createFixPlan };
