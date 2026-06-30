'use strict';

const { VERSION, ROOTS, CAPABILITIES, SAFETY, SYSTEMS, nowIso } = require('./schema');
const { createStatus } = require('./status');
const { createRootsReport } = require('./roots');
const { parseGoal } = require('./goal-parser');
const { createPreviewPlan } = require('./preview-builder');
const { createApplyPlan, recordExecutedApply } = require('./apply-plan');
const { createRollbackPlan } = require('./rollback-planner');
const { verifyTransaction } = require('./verification');
const Store = require('./transaction-store');

function preview(goal, options = {}) {
  return createPreviewPlan(parseGoal(goal, options), options);
}

function worldgen(goal, options = {}) {
  return createPreviewPlan(parseGoal(goal, { ...options, system: SYSTEMS.worldgen }), options);
}

function assetkit(goal, options = {}) {
  return createPreviewPlan(parseGoal(goal, { ...options, system: SYSTEMS.assetkit }), options);
}

function detail(goal, options = {}) {
  return createPreviewPlan(parseGoal(goal, { ...options, system: SYSTEMS.detail }), options);
}

function architecture(goal, options = {}) {
  return createPreviewPlan(parseGoal(goal, { ...options, system: SYSTEMS.architecture }), options);
}

function geometryTest(goal = 'V92 geometry realization test', options = {}) {
  return createPreviewPlan(parseGoal(goal, { ...options, system: SYSTEMS.geometryTest }), options);
}

function cinematic(goal, options = {}) {
  return createPreviewPlan(parseGoal(goal, { ...options, system: SYSTEMS.cinematic }), options);
}

function qaMarkers(goal, options = {}) {
  return createPreviewPlan(parseGoal(goal, { ...options, system: SYSTEMS.qaMarkers }), options);
}

function polish(goal, options = {}) {
  return createPreviewPlan(parseGoal(goal, { ...options, system: SYSTEMS.polish }), options);
}

function safeFix(goal, options = {}) {
  return createPreviewPlan(parseGoal(goal, { ...options, system: SYSTEMS.safeFix }), options);
}

function apply(goal, options = {}) {
  return createApplyPlan(goal, options);
}

function transactionList(limit = 50) {
  return Store.listTransactions(limit);
}

function receipt(transactionId) {
  const receiptValue = Store.getReceipt(transactionId);
  if (!receiptValue) {
    return {
      ok: false,
      version: VERSION,
      status: 'notFound',
      transactionId,
      warnings: [],
      blockers: [`No receipt found for transaction ${transactionId}.`],
      nextCommand: 'tools\\bridge.cmd execute transactions',
    };
  }
  return { ok: true, version: VERSION, at: nowIso(), receipt: receiptValue, nextCommand: receiptValue.verifyCommand };
}

function manifest(target) {
  const tx = Store.getTransaction(target);
  const manifestValue = Store.getManifest(target);
  if (manifestValue) return { ok: true, version: VERSION, at: nowIso(), manifest: manifestValue, nextCommand: `tools\\bridge.cmd execute verify ${target}` };
  return preview(target);
}

function rollbackPlan(transactionId) {
  const receiptValue = Store.getReceipt(transactionId);
  if (!receiptValue) {
    return {
      ok: false,
      version: VERSION,
      status: 'notFound',
      transactionId,
      rollbackPlan: [],
      skippedRollback: [],
      warnings: [],
      blockers: [`No receipt found for transaction ${transactionId}.`],
      nextCommand: 'tools\\bridge.cmd execute transactions',
    };
  }
  return createRollbackPlan(receiptValue);
}

function verify(target, options = {}) {
  const tx = Store.getTransaction(target);
  const receiptValue = Store.getReceipt(target);
  const manifestValue = Store.getManifest(target);
  if (tx && receiptValue) {
    const report = verifyTransaction(tx, receiptValue, { ...options, manifest: manifestValue });
    Store.saveVerification(tx.transactionId, report);
    return report;
  }
  const plan = preview(target, options);
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    mode: 'previewVerification',
    target,
    preview: plan,
    status: 'manualRequired',
    warnings: ['Target was not a known transaction id; returned preview verification guidance for the goal.'],
    blockers: [],
    nextCommand: `tools\\bridge.cmd execute apply "${plan.goal}"`,
  };
}

function rollback(transactionId, options = {}) {
  const tx = Store.getTransaction(transactionId);
  const receiptValue = Store.getReceipt(transactionId);
  const plan = rollbackPlan(transactionId);
  if (!tx || !receiptValue || !plan.ok) return plan;
  const result = {
    ok: true,
    version: VERSION,
    at: nowIso(),
    transactionId,
    mode: 'rollback',
    status: options.executed ? 'rolledBack' : 'rollbackPlanReady',
    rollbackPlan: plan.rollbackPlan,
    skippedRollback: plan.skippedRollback,
    warnings: plan.warnings,
    blockers: plan.blockers,
    nextCommand: options.executed ? `tools\\bridge.cmd execute verify ${transactionId}` : `tools\\bridge.cmd execute rollback ${transactionId}`,
  };
  Store.saveRollback(transactionId, result);
  if (options.executed) {
    tx.status = 'rolledBack';
    tx.updatedAt = nowIso();
    tx.nextCommand = `tools\\bridge.cmd execute verify ${transactionId}`;
    Store.saveTransaction(tx);
  }
  return result;
}

function selfSummary() {
  return {
    ok: true,
    version: VERSION,
    capabilities: CAPABILITIES,
    safety: SAFETY,
    roots: ROOTS,
    transactions: transactionList(10),
    nextCommand: 'tools\\bridge.cmd execute preview "premium anime dungeon hub"',
  };
}

module.exports = {
  VERSION,
  ROOTS,
  CAPABILITIES,
  SAFETY,
  SYSTEMS,
  apply,
  architecture,
  assetkit,
  cinematic,
  createApplyPlan,
  createPreviewPlan,
  createRootsReport,
  createStatus,
  detail,
  geometryTest,
  manifest,
  parseGoal,
  polish,
  preview,
  qaMarkers,
  receipt,
  recordExecutedApply,
  rollback,
  rollbackPlan,
  safeFix,
  selfSummary,
  transactionList,
  verify,
  worldgen,
};
