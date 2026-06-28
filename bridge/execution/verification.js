'use strict';

const { VERSION, nowIso } = require('./schema');

function verifyTransaction(transaction, receipt, options = {}) {
  const created = Array.isArray(receipt && receipt.created) ? receipt.created : [];
  const checks = created.map((item) => ({
    path: item.path,
    expectedClassName: item.className,
    check: item.verifyAction || 'existsWithReceipt',
    status: options.livePaths && options.livePaths.includes(item.path) ? 'pass' : 'pendingLiveVerification',
    reason: options.livePaths ? 'Live path evidence checked by caller.' : 'Local receipt check is available; live Studio path check runs through execute verify when connected.',
  }));
  const receiptStored = Boolean(receipt && receipt.transactionId);
  const manifestStored = Boolean(options.manifest);
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    transactionId: transaction && transaction.transactionId,
    status: receiptStored && manifestStored ? 'verifiedLocalReceipt' : 'manualRequired',
    receiptStored,
    manifestStored,
    createdPathCount: created.length,
    checks,
    warnings: checks.some((check) => check.status === 'pendingLiveVerification') ? ['Live Studio existence checks are pending unless the command was run after a connected apply.'] : [],
    blockers: [],
    nextCommand: transaction && transaction.goal ? `tools\\bridge.cmd visual critique "${transaction.goal}"` : 'tools\\bridge.cmd execute transactions',
  };
}

module.exports = {
  verifyTransaction,
};
