'use strict';

const { VERSION, nowIso, redact, safeGoal } = require('./schema');

function ensureApprovals(runtime = {}) {
  if (!Array.isArray(runtime.approvals)) runtime.approvals = [];
  return runtime.approvals;
}

function normalizeApproval(pending = {}, extra = {}) {
  const approvalId = pending.approvalId || pending.transactionId || extra.approvalId;
  return redact({
    approvalId,
    runId: extra.runId || pending.runId || null,
    action: pending.action || extra.action || 'executeApply',
    safety: pending.safetyClass || extra.safety || 'codexOwnedExecutionKernelApply',
    status: pending.status || extra.status || 'pending',
    goal: safeGoal(pending.goal || extra.goal || 'dashboard execution apply'),
    previewSummary: pending.previewSummary || extra.previewSummary || {},
    transactionPreview: pending.transactionPreview || extra.transactionPreview || pending.previewSummary || {},
    risks: Array.isArray(pending.risks) ? pending.risks : (Array.isArray(extra.risks) ? extra.risks : []),
    approveCommand: `tools\\bridge.cmd dashboard approve ${approvalId}`,
    rejectCommand: `tools\\bridge.cmd dashboard reject ${approvalId}`,
    createdAt: pending.createdAt || extra.createdAt || nowIso(),
    updatedAt: nowIso(),
  });
}

function upsertApproval(runtime, pending = {}, extra = {}) {
  if (!pending || !pending.approvalId) return null;
  const approvals = ensureApprovals(runtime);
  const item = normalizeApproval(pending, extra);
  const existing = approvals.findIndex((approval) => approval.approvalId === item.approvalId);
  if (existing >= 0) approvals[existing] = { ...approvals[existing], ...item };
  else approvals.unshift(item);
  if (approvals.length > 80) approvals.splice(80);
  return item;
}

function syncFromPending(runtime = {}) {
  if (runtime.pendingApproval) return upsertApproval(runtime, runtime.pendingApproval);
  return null;
}

function listApprovals(runtime = {}, status = 'pending') {
  syncFromPending(runtime);
  const approvals = ensureApprovals(runtime);
  const filtered = status === 'all'
    ? approvals
    : approvals.filter((approval) => (approval.status || 'pending') === status);
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    count: filtered.length,
    approvals: filtered,
    warnings: [],
    blockers: [],
    nextCommand: filtered.length ? filtered[0].approveCommand : 'tools\\bridge.cmd dashboard pipeline "premium anime dungeon hub"',
  };
}

function markApproval(runtime = {}, approvalId, status, reason = '') {
  const approvals = ensureApprovals(runtime);
  const item = approvals.find((approval) => approval.approvalId === approvalId);
  if (!item) {
    return {
      ok: false,
      version: VERSION,
      status: 'notFound',
      approvalId,
      warnings: [],
      blockers: [`No dashboard approval found for ${approvalId}.`],
      nextCommand: 'tools\\bridge.cmd dashboard approvals',
    };
  }
  item.status = status;
  item.updatedAt = nowIso();
  if (reason) item.reason = reason;
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    approval: redact(item),
    warnings: [],
    blockers: [],
    nextCommand: 'tools\\bridge.cmd dashboard timeline',
  };
}

module.exports = {
  ensureApprovals,
  listApprovals,
  markApproval,
  normalizeApproval,
  syncFromPending,
  upsertApproval,
};
