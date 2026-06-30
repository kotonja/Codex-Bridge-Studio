'use strict';

const VERSION = '0.88.0';
const DASHBOARD_PATH = '/dashboard';
const DASHBOARD_URL = 'http://127.0.0.1:28123/dashboard';

const ACTIONS = [
  'status',
  'pluginHealth',
  'memoryRecommend',
  'dashboardImageIntake',
  'dashboardImageAnalyze',
  'dashboardImageWorldcompile',
  'dashboardImageTlsCheck',
  'referenceAnalyze',
  'reconstructInfer',
  'worldcompileCompile',
  'worldcompilePackage',
  'executePreview',
  'executeApply',
  'executeVerify',
  'executeRollback',
  'visualCritique',
  'fidelityCompare',
  'dashboardFidelityCompare',
  'dashboardFidelityFixPlan',
  'dashboardFidelityPreview',
  'dashboardFidelityApply',
  'dashboardFidelityRecompare',
  'dashboardFidelityQa',
  'dashboardFidelityLearn',
  'dashboardFidelityRollback',
  'qaLaunch',
  'autopilotReport',
  'memoryLearn',
];

const MUTATING_ACTIONS = new Set([
  'executeApply',
  'executeRollback',
  'dashboardFidelityApply',
  'dashboardFidelityRollback',
  'memoryLearn',
]);

const APPROVAL_REQUIRED_ACTIONS = new Set([
  'executeApply',
]);

const EXTERNAL_RISK_PATTERN = /\b(publish|upload|marketplace|purchase|gamepass|developer\s*product|datastore|save\s*data|economy|currency|robux|monetization|asset\s*insert|insert\s*asset)\b/i;
const SECRET_KEY_PATTERN = /(api[_-]?key|token|sessiontoken|pairingcode|authorization|cookie|password|secret)/i;
const SOURCE_KEY_PATTERN = /^(rawSource|scriptSource|sourceText|oldSource|newSource|patch|patches|mutationPayload|patchPayload|commandPayload)$/i;
const SOURCE_TEXT_PATTERN = /\b(function|local\s+\w+|require\s*\(|game:GetService|module\.exports|import\s+|export\s+default)\b/;
const SAFE_SECRET_STATUS_KEYS = new Set(['apiKeyExposed', 'keyExposed', 'frontendHasApiKey', 'rawApiKeyInFrontend', 'noFrontendApiKey', 'noRobloxPluginApiKey']);

function nowIso() {
  return new Date().toISOString();
}

function safeText(value, fallback = '') {
  return String(value || fallback).trim().replace(/\s+/g, ' ');
}

function safeGoal(value, fallback = 'premium Roblox production goal') {
  return safeText(value, fallback) || fallback;
}

function actionAllowed(action) {
  return ACTIONS.includes(String(action || ''));
}

function hasExternalRisk(value) {
  return EXTERNAL_RISK_PATTERN.test(JSON.stringify(value || ''));
}

function truncate(value, max = 1800) {
  const text = String(value || '');
  return text.length > max ? `${text.slice(0, max)}...[truncated ${text.length - max}]` : text;
}

function redact(value, depth = 0) {
  if (depth > 8) return '[MaxDepth]';
  if (value === undefined) return null;
  if (value === null || typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (SOURCE_TEXT_PATTERN.test(value) && value.length > 240) return '[redacted-source-like-text]';
    return truncate(value);
  }
  if (Array.isArray(value)) return value.slice(0, 80).map((item) => redact(item, depth + 1));
  if (typeof value !== 'object') return value;
  const output = {};
  for (const [key, raw] of Object.entries(value)) {
    if (!SAFE_SECRET_STATUS_KEYS.has(key) && (SECRET_KEY_PATTERN.test(key) || SOURCE_KEY_PATTERN.test(key))) {
      output[key] = '[redacted]';
    } else {
      output[key] = redact(raw, depth + 1);
    }
  }
  return output;
}

function resultSummary(result) {
  const clean = redact(result || {});
  if (!clean || typeof clean !== 'object') return clean;
  return {
    ok: clean.ok,
    status: clean.status,
    version: clean.version,
    mode: clean.mode,
    goal: clean.goal || clean.intent || clean.query,
    referenceId: clean.referenceId,
    actualVisionUsed: clean.actualVisionUsed,
    transactionId: clean.transactionId || (clean.transaction && clean.transaction.transactionId) || (clean.receipt && clean.receipt.transactionId),
    score: clean.overallScore || clean.score || (clean.scores && clean.scores.overall) || clean.launchReadinessScore || clean.finalScore,
    warnings: Array.isArray(clean.warnings) ? clean.warnings.slice(0, 8) : [],
    blockers: Array.isArray(clean.blockers) ? clean.blockers.slice(0, 8) : [],
    nextCommand: clean.nextCommand,
  };
}

module.exports = {
  VERSION,
  DASHBOARD_PATH,
  DASHBOARD_URL,
  ACTIONS,
  MUTATING_ACTIONS,
  APPROVAL_REQUIRED_ACTIONS,
  EXTERNAL_RISK_PATTERN,
  nowIso,
  safeGoal,
  safeText,
  actionAllowed,
  hasExternalRisk,
  redact,
  resultSummary,
};
