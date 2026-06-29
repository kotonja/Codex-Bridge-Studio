'use strict';

const { VERSION, base, stableReferenceId } = require('./schema');
const { getApiKeyInfo } = require('../ai-orchestrator/secret-policy');
const { classifySource, privacyFor } = require('./media-policy');
const Store = require('./reference-store');

function getIntakeReport(input = '', options = {}) {
  const classification = classifySource(input);
  const api = getApiKeyInfo();
  const referenceId = stableReferenceId(classification.input || input || 'reference');
  const report = base({
    referenceId,
    input: classification.input || input,
    mode: classification.mode,
    available: classification.available,
    apiConfigured: api.configured,
    actualVisionUsed: false,
    sourceKind: classification.sourceKind,
    metadata: classification.metadata,
    privacy: privacyFor(classification, api.configured, false),
    warnings: classification.warnings || [],
    blockers: classification.blockers || [],
    nextCommand: classification.available
      ? `tools\\bridge.cmd reference analyze "${String(input || '').replace(/"/g, '\\"')}"`
      : 'tools\\bridge.cmd reference intake "<valid local path or note>"',
    version: VERSION,
  });
  if (options.store !== false) {
    const stored = Store.storeIntake(report);
    report.store = { relativeFile: stored.relativeFile };
  }
  return report;
}

module.exports = {
  getIntakeReport,
};
