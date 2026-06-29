'use strict';

const { VERSION, nowIso, redact } = require('./schema');
const { createSafetyView } = require('./safety-view');

function createDashboardSafetyReport(runtime = {}) {
  const approvals = Array.isArray(runtime.approvals) ? runtime.approvals : [];
  return redact({
    ...createSafetyView(),
    ok: true,
    version: VERSION,
    at: nowIso(),
    dashboardChatNoMutation: true,
    dashboardPipelineStopsAtPreview: true,
    executeApplyRequiresApproval: true,
    approvalQueueCount: approvals.filter((item) => item.status === 'pending').length,
    rawApiKeyInFrontend: false,
    externalImports: false,
    allowedHost: '127.0.0.1',
    unknownActionsBlocked: true,
    externalRisksBlocked: true,
    receiptRequiredForRollback: true,
    warnings: [],
    blockers: [],
    nextCommand: 'tools\\bridge.cmd dashboard approvals',
  });
}

module.exports = { createDashboardSafetyReport };
