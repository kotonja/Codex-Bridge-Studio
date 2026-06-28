'use strict';

const { VERSION, isCodexPath, nowIso } = require('./schema');

function createRollbackPlan(receipt) {
  const created = Array.isArray(receipt && receipt.created) ? receipt.created : [];
  const rollbackPlan = created.map((item) => {
    const safe = item && item.path && isCodexPath(item.path);
    return {
      path: item.path,
      className: item.className,
      action: safe ? 'deleteIfCodexGenerated' : 'skipUnsafe',
      safe,
      reason: safe ? 'Receipt-created Codex-owned object.' : 'Not a Codex-owned receipt path.',
    };
  });
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    transactionId: receipt && receipt.transactionId,
    rollbackPlan,
    skippedRollback: rollbackPlan.filter((item) => !item.safe),
    warnings: rollbackPlan.some((item) => !item.safe) ? ['Some rollback targets were skipped because they are not Codex-owned.'] : [],
    blockers: [],
    nextCommand: receipt && receipt.transactionId ? `tools\\bridge.cmd execute rollback ${receipt.transactionId}` : 'tools\\bridge.cmd execute transactions',
  };
}

module.exports = {
  createRollbackPlan,
};
