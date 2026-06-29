'use strict';

const MemorySchema = require('../memory/schema');
const MemoryStorage = require('../memory/storage');
const { base, quote } = require('./schema');

function rememberFidelityReport(report = {}, options = {}) {
  const goal = report.goal || 'reference fidelity comparison';
  const payload = {
    goal,
    comparisonId: report.comparisonId,
    mode: report.mode,
    actualReferenceVisionUsed: Boolean(report.actualReferenceVisionUsed),
    actualStudioPixelsUsed: Boolean(report.actualStudioPixelsUsed),
    limitedComparison: Boolean(report.limitedComparison),
    scores: report.scores,
    mismatchSummary: (report.mismatches || []).map((item) => ({
      id: item.id,
      category: item.category,
      severity: item.severity,
      safeFix: item.safeFix,
      manualRequired: item.manualRequired,
    })),
    intentionalAdaptations: report.intentionalAdaptations || [],
    rawImageBytesStored: false,
  };
  const item = MemorySchema.createMemoryItem(MemorySchema.TYPES.referenceFidelity || MemorySchema.TYPES.lesson || MemorySchema.TYPES.note, goal, payload, {
    source: options.source || 'fidelity.memory',
    tags: ['fidelity', 'v80', 'reference', 'visual'],
    summary: `Reference fidelity comparison learned for ${goal}.`,
  });
  const stored = MemoryStorage.writeItem(item, options);
  return base({
    status: 'remembered',
    goal,
    item: stored.item,
    relativeFile: stored.relativeFile,
    rawImageBytesStored: false,
    nextCommand: `tools\\bridge.cmd memory recall ${quote(goal)}`,
  });
}

module.exports = { rememberFidelityReport };
