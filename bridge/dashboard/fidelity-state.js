'use strict';

const { VERSION, nowIso, redact } = require('./schema');

function ensureStore(runtime = {}) {
  if (!runtime.fidelityLoop || typeof runtime.fidelityLoop !== 'object') {
    runtime.fidelityLoop = {
      latestLoopId: null,
      loops: [],
    };
  }
  if (!Array.isArray(runtime.fidelityLoop.loops)) runtime.fidelityLoop.loops = [];
  return runtime.fidelityLoop;
}

function compactLoop(loop = {}) {
  return redact({
    loopId: loop.loopId || null,
    goal: loop.goal || '',
    status: loop.status || null,
    mode: loop.mode || null,
    actualReferenceVisionUsed: loop.actualReferenceVisionUsed === true,
    actualStudioPixelsUsed: loop.actualStudioPixelsUsed === true,
    limitedComparison: loop.limitedComparison !== false,
    baselineScore: loop.baselineScore == null ? null : loop.baselineScore,
    afterScore: loop.afterScore == null ? null : loop.afterScore,
    scoreDelta: loop.scoreDelta == null ? null : loop.scoreDelta,
    mismatchCount: Array.isArray(loop.mismatches) ? loop.mismatches.length : 0,
    adaptationCount: Array.isArray(loop.intentionalAdaptations) ? loop.intentionalAdaptations.length : 0,
    manualRequiredCount: Array.isArray(loop.manualRequired) ? loop.manualRequired.length : 0,
    safeFixCount: Array.isArray(loop.safeFixes) ? loop.safeFixes.length : 0,
    approvalId: loop.approvalId || null,
    transactionId: loop.transactionId || null,
    rollbackStatus: loop.rollbackStatus || null,
    updatedAt: loop.updatedAt || loop.createdAt || null,
    nextCommand: loop.nextCommand || 'tools\\bridge.cmd dashboard fidelity-loop "<reference-or-goal>"',
  });
}

function upsertLoop(runtime = {}, loop = {}) {
  const store = ensureStore(runtime);
  const clean = redact({
    ...loop,
    updatedAt: nowIso(),
  });
  const loopId = clean.loopId || `dash_fidelity_${Date.now()}`;
  clean.loopId = loopId;
  const existing = store.loops.findIndex((item) => item.loopId === loopId);
  if (existing >= 0) store.loops[existing] = { ...store.loops[existing], ...clean };
  else store.loops.unshift(clean);
  store.latestLoopId = loopId;
  if (store.loops.length > 25) store.loops.splice(25);
  runtime.latest = runtime.latest || {};
  runtime.latest.fidelityLoop = compactLoop(clean);
  return clean;
}

function getLatestLoop(runtime = {}) {
  const store = ensureStore(runtime);
  return store.loops.find((loop) => loop.loopId === store.latestLoopId) || store.loops[0] || null;
}

function createFidelityState(runtime = {}) {
  const store = ensureStore(runtime);
  const latest = getLatestLoop(runtime);
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    latestLoopId: latest ? latest.loopId : null,
    baselineScore: latest && latest.baselineScore != null ? latest.baselineScore : null,
    afterScore: latest && latest.afterScore != null ? latest.afterScore : null,
    scoreDelta: latest && latest.scoreDelta != null ? latest.scoreDelta : null,
    status: latest ? latest.status : null,
    latest: latest ? compactLoop(latest) : null,
    loops: store.loops.slice(0, 12).map(compactLoop),
    warnings: [],
    blockers: [],
    nextCommand: latest ? latest.nextCommand : 'tools\\bridge.cmd dashboard fidelity-loop "<reference-or-goal>"',
  };
}

module.exports = {
  compactLoop,
  createFidelityState,
  ensureStore,
  getLatestLoop,
  upsertLoop,
};
