'use strict';

const { VERSION, nowIso } = require('./schema');

function estimateForPlan(plan = {}) {
  const toolCount = Array.isArray(plan.steps) ? plan.steps.length : 0;
  return {
    currency: 'USD',
    estimated: true,
    inputTokens: 1200 + toolCount * 120,
    outputTokens: 700 + toolCount * 80,
    low: 0,
    high: 0.05,
    note: 'Local estimate only; exact API cost requires provider usage data.',
  };
}

function costReport(runs = []) {
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    runCount: runs.length,
    totalEstimatedUsd: 0,
    exactProviderUsageAvailable: false,
    warnings: ['Cost report is estimated unless a live API response includes usage.'],
    blockers: [],
    nextCommand: 'tools\\bridge.cmd ai runs',
  };
}

module.exports = {
  costReport,
  estimateForPlan,
};
