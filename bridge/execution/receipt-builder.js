'use strict';

const { VERSION, nowIso } = require('./schema');

function actionToCreated(action) {
  return {
    path: action.path,
    className: action.className || (action.type === 'model' ? 'Model' : action.type === 'part' ? 'Part' : 'Folder'),
    role: action.role || action.type || 'generated',
    reason: action.reason || 'Compiled by V72 Production Execution Kernel.',
    sourcePlan: action.sourcePlan || action.source || 'execution',
    expectedProperties: action.expectedProperties || (action.verify && action.verify.expectedProperties) || {},
    propertyVerification: Boolean(action.expectedProperties || (action.verify && action.verify.expectedProperties)),
    rollbackAction: 'deleteIfCodexGenerated',
    verifyAction: action.expectedProperties || (action.verify && action.verify.expectedProperties) ? 'propertyLevelReceipt' : 'existsWithReceipt',
  };
}

function buildReceipt(transaction, plan, applyResult = null) {
  const created = (plan.actions || [])
    .filter((action) => action && action.path && action.role !== 'root')
    .map(actionToCreated);
  return {
    version: VERSION,
    transactionId: transaction.transactionId,
    goal: transaction.goal,
    summary: `${transaction.system} ${transaction.mode} for ${transaction.goal}`,
    created,
    attributes: {
      CodexGenerated: true,
      CodexSystem: 'ExecutionKernel',
      CodexVersion: VERSION,
      CodexGoal: transaction.goal,
    },
    applyResultSummary: applyResult ? {
      status: applyResult.status || null,
      commandId: applyResult.id || applyResult.commandId || null,
      createdCount: applyResult.result && applyResult.result.summary ? applyResult.result.summary.created : undefined,
      updatedCount: applyResult.result && applyResult.result.summary ? applyResult.result.summary.updated : undefined,
      failedCount: applyResult.result && applyResult.result.summary ? applyResult.result.summary.failed : undefined,
    } : null,
    rollbackCommand: `tools\\bridge.cmd execute rollback ${transaction.transactionId}`,
    verifyCommand: `tools\\bridge.cmd execute verify ${transaction.transactionId}`,
    createdAt: transaction.createdAt || nowIso(),
    updatedAt: nowIso(),
  };
}

module.exports = {
  buildReceipt,
};
