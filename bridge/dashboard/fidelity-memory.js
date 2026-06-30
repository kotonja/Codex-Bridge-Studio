'use strict';

const Memory = require('../memory');
const { VERSION, nowIso, redact, safeGoal } = require('./schema');

function learnFidelityLoop(goal, loop = {}, options = {}) {
  const cleanGoal = safeGoal(goal || loop.goal, 'reference fidelity loop');
  const note = [
    `Dashboard fidelity loop for ${cleanGoal}.`,
    `Baseline score: ${loop.baselineScore == null ? 'unknown' : loop.baselineScore}.`,
    `After score: ${loop.afterScore == null ? 'unknown' : loop.afterScore}.`,
    `Delta: ${loop.scoreDelta == null ? 'unknown' : loop.scoreDelta}.`,
    `Mode: ${loop.mode || 'unknown'}.`,
    `Limited comparison: ${loop.limitedComparison !== false}.`,
    `Safe fixes: ${Array.isArray(loop.safeFixes) ? loop.safeFixes.length : 0}.`,
    `Manual fixes: ${Array.isArray(loop.manualRequired) ? loop.manualRequired.length : 0}.`,
  ].join(' ');
  const result = Memory.rememberProductionNote(note, {
    ...options,
    goal: `fidelity ${cleanGoal}`,
    tags: ['dashboard', 'fidelity', 'reference-match'],
    source: 'dashboard.fidelity.learn',
    payload: {
      goal: cleanGoal,
      baselineScore: loop.baselineScore,
      afterScore: loop.afterScore,
      scoreDelta: loop.scoreDelta,
      status: loop.status,
      mode: loop.mode,
      actualReferenceVisionUsed: loop.actualReferenceVisionUsed === true,
      actualStudioPixelsUsed: loop.actualStudioPixelsUsed === true,
      limitedComparison: loop.limitedComparison !== false,
      mismatchCount: Array.isArray(loop.mismatches) ? loop.mismatches.length : 0,
      safeFixCount: Array.isArray(loop.safeFixes) ? loop.safeFixes.length : 0,
      manualRequiredCount: Array.isArray(loop.manualRequired) ? loop.manualRequired.length : 0,
    },
  });
  return redact({
    ok: result.ok !== false,
    version: VERSION,
    at: nowIso(),
    goal: cleanGoal,
    mode: 'dashboardFidelityMemory',
    status: result.status || 'learned',
    result,
    warnings: result.warnings || [],
    blockers: result.blockers || [],
    nextCommand: `tools\\bridge.cmd memory recall "fidelity ${cleanGoal}"`,
  });
}

module.exports = {
  learnFidelityLoop,
};
