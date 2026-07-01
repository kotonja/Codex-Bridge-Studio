'use strict';

const Execution = require('../execution');
const { createPreview } = require('./preview-builder');
const { base, safeGoal } = require('./schema');

function createApplyRequest(goal, options = {}) {
  const cleanGoal = safeGoal(goal);
  const preview = createPreview(cleanGoal, options);
  if (options.approved !== true && options.allowApply !== true) {
    return base({
      ok: false,
      goal: cleanGoal,
      status: 'manualRequired',
      approvalRequired: true,
      preview,
      reason: 'polish apply does not bypass approval. Review the preview, then route through V72 execute apply or call polish apply with an explicit approved flag.',
      warnings: ['No Studio mutation was attempted.'],
      blockers: [],
      nextCommand: `tools\\bridge.cmd execute apply "${cleanGoal} polish pass"`,
    });
  }
  const applyPlan = Execution.apply(`${cleanGoal} polish pass`, { ...options, source: 'polish.apply' });
  return base({
    goal: cleanGoal,
    status: applyPlan.ok ? 'readyToApply' : applyPlan.status,
    approvalRequired: true,
    applyPlan,
    transactionId: applyPlan.transactionId,
    warnings: applyPlan.warnings || [],
    blockers: applyPlan.blockers || [],
    nextCommand: applyPlan.nextCommand,
  });
}

function verifyPolishTransaction(transactionId, options = {}) {
  return Execution.verify(transactionId, { ...options, source: 'polish.verify' });
}

function rollbackPolishTransaction(transactionId, options = {}) {
  if (options.executed === true) return Execution.rollback(transactionId, { ...options, executed: true, source: 'polish.rollback' });
  return Execution.rollbackPlan(transactionId);
}

module.exports = {
  createApplyRequest,
  rollbackPolishTransaction,
  verifyPolishTransaction,
};
