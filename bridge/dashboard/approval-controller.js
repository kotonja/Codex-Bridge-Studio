'use strict';

const { VERSION, nowIso, redact } = require('./schema');
const { runAllowedAction } = require('./command-runner');
const { remember } = require('./run-controller');

async function approveDashboardRun(runtime, body = {}, options = {}) {
  const pending = runtime.pendingApproval;
  if (!pending) {
    return {
      ok: false,
      version: VERSION,
      status: 'manualRequired',
      reason: 'noPendingDashboardApproval',
      warnings: [],
      blockers: ['There is no pending dashboard preview to approve.'],
      nextCommand: 'tools\\bridge.cmd dashboard state',
    };
  }
  const approvalId = body.approvalId || body.id || pending.approvalId;
  if (approvalId !== pending.approvalId) {
    return {
      ok: false,
      version: VERSION,
      status: 'blocked',
      reason: 'approvalIdMismatch',
      warnings: [],
      blockers: [`Approval id ${approvalId} does not match pending preview ${pending.approvalId}.`],
      nextCommand: 'tools\\bridge.cmd dashboard state',
    };
  }
  const result = await runAllowedAction('executeApply', { goal: pending.goal, approvalId, transactionId: pending.approvalId }, { ...options, approved: true });
  runtime.pendingApproval = null;
  const clean = remember(runtime, 'executeApply', result, pending.goal);
  return redact({
    ...clean,
    approvedAt: nowIso(),
    approvedPreviewId: approvalId,
    pendingCleared: true,
  });
}

function cancelDashboardRun(runtime, body = {}) {
  const pending = runtime.pendingApproval;
  runtime.pendingApproval = null;
  if (runtime.latest && runtime.latest.timeline) runtime.latest.timeline['Execute Apply'] = 'cancelled';
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    status: pending ? 'cancelled' : 'nothingPending',
    cancelled: pending,
    reason: body.reason || 'dashboardCancel',
    nextCommand: 'tools\\bridge.cmd dashboard state',
  };
}

module.exports = { approveDashboardRun, cancelDashboardRun };
