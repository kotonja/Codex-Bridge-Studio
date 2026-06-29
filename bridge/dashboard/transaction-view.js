'use strict';

const Execution = require('../execution');
const { VERSION, redact } = require('./schema');

function summarizeTransaction(item = {}) {
  const tx = item.receipt || item.transaction || item;
  return redact({
    transactionId: tx.transactionId || item.transactionId || item.id,
    status: tx.status || item.status,
    goal: tx.goal || item.goal,
    system: tx.system || item.system,
    createdAt: tx.createdAt || item.createdAt,
    updatedAt: tx.updatedAt || item.updatedAt,
    createdPathCount: Array.isArray(tx.created) ? tx.created.length : (Array.isArray(item.createdPaths) ? item.createdPaths.length : undefined),
    applyStatus: tx.applyResultSummary && tx.applyResultSummary.status,
    commandId: tx.applyResultSummary && tx.applyResultSummary.commandId,
    verifyCommand: tx.verifyCommand || (tx.transactionId ? `tools\\bridge.cmd execute verify ${tx.transactionId}` : undefined),
    rollbackCommand: tx.rollbackCommand || (tx.transactionId ? `tools\\bridge.cmd execute rollback ${tx.transactionId}` : undefined),
  });
}

function createTransactionView(limit = 12, options = {}) {
  const source = options.transactions || Execution.transactionList(limit);
  const transactions = Array.isArray(source.transactions) ? source.transactions : (Array.isArray(source) ? source : []);
  return {
    ok: true,
    version: VERSION,
    at: new Date().toISOString(),
    transactionCount: source.transactionCount || source.count || transactions.length,
    transactions: transactions.slice(0, limit).map(summarizeTransaction),
    nextCommand: 'tools\\bridge.cmd execute transactions',
  };
}

module.exports = { createTransactionView, summarizeTransaction };
