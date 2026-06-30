'use strict';

const { VERSION, nowIso } = require('./schema');

function verifyTransaction(transaction, receipt, options = {}) {
  const created = Array.isArray(receipt && receipt.created) ? receipt.created : [];
  const checks = created.map((item) => ({
    path: item.path,
    expectedClassName: item.className,
    check: item.verifyAction || 'existsWithReceipt',
    status: options.livePaths && options.livePaths.includes(item.path) ? 'pass' : 'pendingLiveVerification',
    expectedProperties: item.expectedProperties || {},
    propertyLevel: Boolean(item.expectedProperties && Object.keys(item.expectedProperties).length),
    sizeMatches: item.expectedProperties && item.expectedProperties.Size ? 'pendingLiveVerification' : 'notApplicable',
    positionMatches: item.expectedProperties && (item.expectedProperties.Position || item.expectedProperties.CFrame) ? 'pendingLiveVerification' : 'notApplicable',
    colorMatches: item.expectedProperties && item.expectedProperties.Color ? 'pendingLiveVerification' : 'notApplicable',
    materialMatches: item.expectedProperties && item.expectedProperties.Material ? 'pendingLiveVerification' : 'notApplicable',
    anchoredMatches: item.expectedProperties && item.expectedProperties.Anchored !== undefined ? 'pendingLiveVerification' : 'notApplicable',
    canCollideMatches: item.expectedProperties && item.expectedProperties.CanCollide !== undefined ? 'pendingLiveVerification' : 'notApplicable',
    transparencyMatches: item.expectedProperties && item.expectedProperties.Transparency !== undefined ? 'pendingLiveVerification' : 'notApplicable',
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
    propertyCheckCount: checks.filter((check) => check.propertyLevel).length,
    propertyVerificationContract: {
      checksSize: checks.some((check) => check.sizeMatches !== 'notApplicable'),
      checksPosition: checks.some((check) => check.positionMatches !== 'notApplicable'),
      checksColor: checks.some((check) => check.colorMatches !== 'notApplicable'),
      checksMaterial: checks.some((check) => check.materialMatches !== 'notApplicable'),
      checksAnchored: checks.some((check) => check.anchoredMatches !== 'notApplicable'),
      checksCanCollide: checks.some((check) => check.canCollideMatches !== 'notApplicable'),
    },
    warnings: checks.some((check) => check.status === 'pendingLiveVerification') ? ['Live Studio existence checks are pending unless the command was run after a connected apply.'] : [],
    blockers: [],
    nextCommand: transaction && transaction.goal ? `tools\\bridge.cmd visual critique "${transaction.goal}"` : 'tools\\bridge.cmd execute transactions',
  };
}

module.exports = {
  verifyTransaction,
};
