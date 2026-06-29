'use strict';

const { VERSION, DASHBOARD_URL, nowIso, redact } = require('./schema');
const { createDashboardStatus } = require('./status');
const { createSafetyView } = require('./safety-view');
const { createScorePanel } = require('./report-view');
const { createTransactionView } = require('./transaction-view');

const TIMELINE_STEPS = [
  'Memory',
  'Reference',
  'Reconstruction',
  'Worldcompile',
  'Execute Preview',
  'Execute Apply',
  'Verify',
  'Visual',
  'Fidelity',
  'QA',
  'Autopilot',
  'Memory Learn',
];

function createDashboardState(env = {}, runtime = {}) {
  const status = createDashboardStatus(env);
  const transactions = typeof env.transactions === 'function'
    ? env.transactions()
    : createTransactionView(10);
  const latest = runtime.latest || {};
  const pendingApproval = runtime.pendingApproval || null;
  const blockers = [];
  const warnings = [];
  if (!status.bridge.studioConnected) warnings.push('Studio is not connected; dashboard read/planning still works, but apply needs a fresh paired Studio place.');
  if (status.api.configured !== true) warnings.push('OPENAI_API_KEY is not configured; AI/reference vision routes use offline or metadata-only fallback.');
  return redact({
    version: VERSION,
    ok: true,
    at: nowIso(),
    url: DASHBOARD_URL,
    bridge: status.bridge,
    studio: status.studio,
    api: status.api,
    safety: {
      ...createSafetyView(),
      mutationsRequireExecutionKernel: true,
      approvalRequiredForApply: true,
    },
    latest: {
      goal: latest.goal || '',
      lastCommand: latest.lastCommand || null,
      lastResult: latest.lastResult || null,
      scores: createScorePanel(latest),
      transactions: transactions.transactions || [],
    },
    timeline: TIMELINE_STEPS.map((name) => ({
      name,
      status: latest.timeline && latest.timeline[name] ? latest.timeline[name] : (name === 'Execute Apply' && pendingApproval ? 'pendingApproval' : 'idle'),
    })),
    pendingApproval,
    availableActions: [
      'status',
      'referenceAnalyze',
      'worldcompileCompile',
      'worldcompilePackage',
      'executePreview',
      pendingApproval ? 'executeApply' : null,
      'visualCritique',
      'fidelityCompare',
      'qaLaunch',
      'autopilotReport',
      'memoryRecommend',
      'memoryLearn',
    ].filter(Boolean),
    warnings: [...warnings, ...(latest.warnings || [])],
    blockers: [...blockers, ...(latest.blockers || [])],
    nextCommand: pendingApproval ? 'Review dashboard preview, then approve or cancel.' : 'tools\\bridge.cmd dashboard open',
  });
}

module.exports = { TIMELINE_STEPS, createDashboardState };
