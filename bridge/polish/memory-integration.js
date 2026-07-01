'use strict';

const MemorySchema = require('../memory/schema');
const MemoryStorage = require('../memory/storage');
const { createDelta } = require('./score-delta');
const { normalizeIssues } = require('./issue-normalizer');
const { base, safeGoal } = require('./schema');

function learnPolishResult(goal, options = {}) {
  const cleanGoal = safeGoal(goal);
  const delta = options.delta || createDelta(cleanGoal, options);
  const issueReport = options.issueReport || normalizeIssues(cleanGoal, options);
  const payload = {
    goal: cleanGoal,
    baseline: delta.baseline,
    after: delta.after,
    deltas: delta.deltas,
    improved: delta.improved,
    regressed: delta.regressed,
    unchanged: delta.unchanged,
    issuesFixed: issueReport.issues.filter((entry) => !entry.manualRequired).slice(0, 12).map((entry) => ({ id: entry.id, source: entry.source, category: entry.category, title: entry.title })),
    issuesRemaining: issueReport.issues.filter((entry) => entry.manualRequired).slice(0, 12).map((entry) => ({ id: entry.id, source: entry.source, category: entry.category, title: entry.title })),
    manualRequired: issueReport.issues.filter((entry) => entry.manualRequired).slice(0, 12),
    rollbackCommand: options.transactionId ? `tools\\bridge.cmd execute rollback ${options.transactionId}` : 'tools\\bridge.cmd execute transactions',
  };
  const item = MemorySchema.createMemoryItem(MemorySchema.TYPES.lesson, cleanGoal, payload, {
    source: 'polish.memory',
    tags: ['polish', 'v96', 'score-delta', 'scene-quality'],
    summary: `V96 integrated polish lesson for ${cleanGoal}.`,
  });
  const stored = MemoryStorage.writeItem(item, options);
  return base({
    status: 'learned',
    goal: cleanGoal,
    learnedCount: 1,
    item: { id: stored.item.id, type: stored.item.type, summary: stored.item.summary },
    relativeFile: stored.relativeFile,
    deltaSummary: delta.deltas,
    noSecretsStored: true,
    noRawImageBytesStored: true,
    nextCommand: `tools\\bridge.cmd memory recall "${cleanGoal}"`,
  });
}

module.exports = { learnPolishResult };
