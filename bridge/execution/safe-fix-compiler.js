'use strict';

const Autopilot = require('../autopilot');
const { ROOTS, SYSTEMS, VERSION, isCodexPath, safeGoal, slugify } = require('./schema');

function compileSafeFix(goal, context = {}) {
  const clean = safeGoal(goal);
  const fixPlan = Autopilot.createFixPlan(clean);
  const issues = Autopilot.createIssueReport(clean);
  const tx = context.transactionId;
  const base = `${ROOTS.workspace.autopilot}.ExecutionSafeFix_${slugify(clean)}_${String(tx || 'preview').slice(-6)}`;
  const manualRequiredActions = [];
  const blockedActions = [];
  const safeActions = [
    { type: 'folder', className: 'Folder', path: ROOTS.workspace.autopilot, role: 'root', reason: 'Codex Autopilot root.' },
    { type: 'model', className: 'Model', path: base, role: 'safeFixExecution', reason: 'Codex-owned safe-fix evidence package.' },
    { type: 'folder', className: 'Folder', path: `${base}.Evidence`, role: 'evidence', reason: 'Evidence-linked issue records.' },
    { type: 'folder', className: 'Folder', path: `${base}.ManualRequired`, role: 'manualRequired', reason: 'Unsafe or non-Codex fixes are explicitly recorded here.' },
    { type: 'createInstance', className: 'StringValue', path: `${base}.Evidence.FixPlanJson`, role: 'fixPlan', reason: 'Serialized Autopilot fix plan.', value: JSON.stringify(fixPlan, null, 2) },
    { type: 'createInstance', className: 'StringValue', path: `${base}.Evidence.IssueReportJson`, role: 'issueReport', reason: 'Serialized evidence issue report.', value: JSON.stringify(issues, null, 2) },
  ];
  for (const action of fixPlan.safeActions || []) {
    const paths = action.targetPaths || [];
    if (!paths.length || paths.every(isCodexPath)) {
      safeActions.push({ type: 'createInstance', className: 'StringValue', path: `${base}.Evidence.${slugify(action.command || action.kind || 'SafeAction')}`, role: 'safeActionManifest', reason: 'Safe action manifest; actual production edits remain separate and evidence-linked.', value: JSON.stringify(action, null, 2) });
    } else {
      manualRequiredActions.push({ action, reason: 'Safe fix targets non-Codex production content and requires explicit human review.' });
    }
  }
  for (const action of fixPlan.blockedActions || []) {
    blockedActions.push({ action, reason: 'Autopilot marked this fix as blocked.' });
  }
  return {
    ok: true,
    version: VERSION,
    goal: clean,
    system: SYSTEMS.safeFix,
    sourcePlan: 'autopilot.safeFix',
    fixPlan,
    issues,
    actions: safeActions,
    manualRequiredActions,
    blockedActions,
    manifest: { fixPlan, issues, basePath: base },
    warnings: manualRequiredActions.length ? ['Some safe fixes require manual review because they target non-Codex content.'] : [],
    blockers: blockedActions.map((item) => item.reason),
  };
}

module.exports = {
  compileSafeFix,
};
