'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { VERSION, nowIso } = require('./schema');

const ROOT = path.join(process.cwd(), '.codex-studio', 'execution-v72');
const DIRS = {
  transactions: path.join(ROOT, 'transactions'),
  receipts: path.join(ROOT, 'receipts'),
  manifests: path.join(ROOT, 'manifests'),
  rollback: path.join(ROOT, 'rollback'),
  verification: path.join(ROOT, 'verification'),
};
const INDEX = path.join(ROOT, 'index.json');

function ensureStore() {
  fs.mkdirSync(ROOT, { recursive: true });
  for (const dir of Object.values(DIRS)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(INDEX)) {
    fs.writeFileSync(INDEX, JSON.stringify({ version: VERSION, updatedAt: nowIso(), transactions: [] }, null, 2) + '\n', 'utf8');
  }
}

function readJson(file, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  ensureStore();
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8');
  return file;
}

function transactionPath(id) {
  return path.join(DIRS.transactions, `${id}.json`);
}

function receiptPath(id) {
  return path.join(DIRS.receipts, `${id}.json`);
}

function manifestPath(id) {
  return path.join(DIRS.manifests, `${id}.json`);
}

function rollbackPath(id) {
  return path.join(DIRS.rollback, `${id}.json`);
}

function verificationPath(id) {
  return path.join(DIRS.verification, `${id}.json`);
}

function updateIndex(transaction) {
  ensureStore();
  const index = readJson(INDEX, { version: VERSION, transactions: [] });
  const transactions = Array.isArray(index.transactions) ? index.transactions : [];
  const compact = {
    transactionId: transaction.transactionId,
    goal: transaction.goal,
    system: transaction.system,
    mode: transaction.mode,
    status: transaction.status,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
    receiptPath: path.relative(process.cwd(), receiptPath(transaction.transactionId)),
    manifestPath: path.relative(process.cwd(), manifestPath(transaction.transactionId)),
    nextCommand: transaction.nextCommand,
  };
  const existing = transactions.findIndex((item) => item.transactionId === compact.transactionId);
  if (existing >= 0) transactions[existing] = compact;
  else transactions.unshift(compact);
  while (transactions.length > 200) transactions.pop();
  writeJson(INDEX, { version: VERSION, updatedAt: nowIso(), transactions });
  return compact;
}

function saveTransaction(transaction) {
  writeJson(transactionPath(transaction.transactionId), transaction);
  updateIndex(transaction);
  return transaction;
}

function saveReceipt(receipt) {
  writeJson(receiptPath(receipt.transactionId), receipt);
  return receipt;
}

function saveManifest(transactionId, manifest) {
  writeJson(manifestPath(transactionId), manifest);
  return manifest;
}

function saveRollback(transactionId, rollback) {
  writeJson(rollbackPath(transactionId), rollback);
  return rollback;
}

function saveVerification(transactionId, verification) {
  writeJson(verificationPath(transactionId), verification);
  return verification;
}

function getTransaction(transactionId) {
  ensureStore();
  return readJson(transactionPath(transactionId));
}

function getReceipt(transactionId) {
  ensureStore();
  return readJson(receiptPath(transactionId));
}

function getManifest(transactionId) {
  ensureStore();
  return readJson(manifestPath(transactionId));
}

function listTransactions(limit = 50) {
  ensureStore();
  const index = readJson(INDEX, { version: VERSION, transactions: [] });
  const transactions = Array.isArray(index.transactions) ? index.transactions.slice(0, limit) : [];
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    root: ROOT,
    count: transactions.length,
    transactions,
    nextCommand: transactions[0] ? `tools\\bridge.cmd execute receipt ${transactions[0].transactionId}` : 'tools\\bridge.cmd execute preview "premium anime dungeon hub"',
  };
}

module.exports = {
  DIRS,
  INDEX,
  ROOT,
  ensureStore,
  getManifest,
  getReceipt,
  getTransaction,
  listTransactions,
  manifestPath,
  receiptPath,
  rollbackPath,
  saveManifest,
  saveReceipt,
  saveRollback,
  saveTransaction,
  saveVerification,
  transactionPath,
  updateIndex,
  verificationPath,
};
