'use strict';

const { VERSION, nowIso, transactionId } = require('./schema');
const { parseGoal } = require('./goal-parser');
const { createPreviewPlan } = require('./preview-builder');
const { assertApplySafe } = require('./safety-policy');
const { compileBlueprint } = require('./instance-compiler');
const { buildReceipt } = require('./receipt-builder');
const { createRollbackPlan } = require('./rollback-planner');
const { verifyTransaction } = require('./verification');
const { bakeManifest } = require('./manifest-store');
const Store = require('./transaction-store');

function createTransactionFromPlan(plan, mode = 'preview') {
  const at = nowIso();
  return {
    version: VERSION,
    transactionId: plan.transactionId || transactionId(plan.goal, plan.system),
    goal: plan.goal,
    system: plan.system || 'ExecutionKernel',
    mode,
    status: mode === 'preview' ? 'previewed' : 'queued',
    createdPaths: [],
    changedPaths: [],
    skippedActions: [],
    manualRequiredActions: plan.manualRequiredActions || [],
    blockedActions: plan.blockedActions || [],
    rollbackPlan: plan.rollbackPlan || [],
    verification: {},
    safety: {},
    warnings: plan.warnings || [],
    blockers: plan.blockers || [],
    createdAt: at,
    updatedAt: at,
    nextCommand: mode === 'preview' ? `tools\\bridge.cmd execute apply "${plan.goal}"` : `tools\\bridge.cmd execute verify ${plan.transactionId}`,
  };
}

function createApplyPlan(goal, options = {}) {
  const parsed = parseGoal(goal, options);
  const plan = createPreviewPlan(parsed, options);
  const safety = assertApplySafe(plan);
  const transaction = createTransactionFromPlan(plan, 'apply');
  transaction.safety = safety.safety || safety;
  if (!safety.ok) {
    transaction.status = safety.status || 'manualRequired';
    transaction.manualRequiredActions = safety.manualRequiredActions || transaction.manualRequiredActions;
    transaction.blockedActions = safety.blockers ? safety.blockers.map((reason) => ({ reason })) : transaction.blockedActions;
    transaction.blockers = safety.blockers || transaction.blockers;
    transaction.warnings = safety.warnings || transaction.warnings;
  }
  const blueprint = safety.ok ? compileBlueprint(plan) : null;
  const receipt = buildReceipt(transaction, plan);
  const rollback = createRollbackPlan(receipt);
  const manifest = bakeManifest(transaction, plan, receipt);
  transaction.rollbackPlan = rollback.rollbackPlan;
  transaction.createdPaths = receipt.created.map((item) => item.path);
  transaction.verification = verifyTransaction(transaction, receipt, { manifest });
  Store.saveTransaction(transaction);
  Store.saveReceipt(receipt);
  Store.saveRollback(transaction.transactionId, rollback);
  Store.saveVerification(transaction.transactionId, transaction.verification);
  return {
    ok: safety.ok,
    version: VERSION,
    at: nowIso(),
    goal: parsed.goal,
    transactionId: transaction.transactionId,
    status: safety.ok ? 'readyToApply' : transaction.status,
    transaction,
    preview: plan,
    blueprint,
    receipt,
    rollbackPlan: rollback.rollbackPlan,
    verification: transaction.verification,
    warnings: transaction.warnings,
    blockers: transaction.blockers,
    manualRequiredActions: transaction.manualRequiredActions,
    nextCommand: safety.ok ? `tools\\bridge.cmd execute verify ${transaction.transactionId}` : 'tools\\bridge.cmd execute preview "<goal>"',
  };
}

function recordExecutedApply(applyPlan, commandStatus) {
  const transaction = applyPlan.transaction || Store.getTransaction(applyPlan.transactionId);
  if (!transaction) return applyPlan;
  const status = commandStatus && commandStatus.status === 'executed' ? 'executed' : (commandStatus && commandStatus.status) || 'failed';
  transaction.status = status;
  transaction.updatedAt = nowIso();
  transaction.commandId = commandStatus && commandStatus.id;
  transaction.applyResult = commandStatus || null;
  transaction.nextCommand = `tools\\bridge.cmd execute verify ${transaction.transactionId}`;
  const receipt = buildReceipt(transaction, applyPlan.preview || {}, commandStatus);
  const manifest = bakeManifest(transaction, applyPlan.preview || {}, receipt);
  transaction.verification = verifyTransaction(transaction, receipt, { manifest, livePaths: transaction.createdPaths });
  Store.saveTransaction(transaction);
  Store.saveReceipt(receipt);
  Store.saveVerification(transaction.transactionId, transaction.verification);
  return {
    ...applyPlan,
    ok: status === 'executed',
    status,
    transaction,
    receipt,
    verification: transaction.verification,
    nextCommand: transaction.nextCommand,
  };
}

module.exports = {
  createApplyPlan,
  createTransactionFromPlan,
  recordExecutedApply,
};
