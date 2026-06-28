'use strict';

const { VERSION, nowIso } = require('./schema');
const Store = require('./transaction-store');

function bakeManifest(transaction, plan, receipt) {
  const manifest = {
    ok: true,
    version: VERSION,
    at: nowIso(),
    transactionId: transaction.transactionId,
    goal: transaction.goal,
    system: transaction.system,
    mode: transaction.mode,
    status: transaction.status,
    actionCount: Array.isArray(plan.actions) ? plan.actions.length : 0,
    rootPaths: plan.rootPaths || [],
    manifest: plan.manifest || {},
    receiptSummary: receipt ? {
      createdCount: Array.isArray(receipt.created) ? receipt.created.length : 0,
      rollbackCommand: receipt.rollbackCommand,
      verifyCommand: receipt.verifyCommand,
    } : null,
    nextCommand: `tools\\bridge.cmd execute verify ${transaction.transactionId}`,
  };
  Store.saveManifest(transaction.transactionId, manifest);
  return manifest;
}

module.exports = {
  bakeManifest,
};
