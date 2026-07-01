'use strict';

const Execution = require('../execution');
const { createPolishPlan } = require('./safe-polish-planner');
const Store = require('./manifest-store');
const { base, safeGoal } = require('./schema');

function createPreview(goal, options = {}) {
  const cleanGoal = safeGoal(goal);
  const plan = options.plan || createPolishPlan(cleanGoal, options);
  const executionPreview = Execution.polish(`${cleanGoal} polish pass`, { source: 'polish.preview', ...options });
  const report = base({
    goal: cleanGoal,
    mode: 'preview',
    status: executionPreview.ok ? 'previewed' : 'manualRequired',
    plan,
    executionPreview,
    executionCompatible: true,
    executionSystem: executionPreview.system,
    actionCount: Array.isArray(executionPreview.actions) ? executionPreview.actions.length : 0,
    operationCount: executionPreview.operationCount,
    rollbackPlan: executionPreview.rollbackPlan,
    verificationPlan: executionPreview.verificationPlan,
    approvalRequired: true,
    previewOnly: true,
    manualRequired: plan.manualRequired,
    warnings: [...(plan.warnings || []), ...(executionPreview.warnings || [])],
    blockers: [...(plan.blockers || []), ...(executionPreview.blockers || [])],
    nextCommand: `tools\\bridge.cmd execute apply "${cleanGoal} polish pass"`,
  });
  const stored = Store.saveReport('previews', report);
  return { ...report, stored };
}

module.exports = {
  createPreview,
};
