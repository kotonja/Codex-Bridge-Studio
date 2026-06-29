'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { STORE_ROOT } = require('./schema');

const SECRET_FILE = path.join(process.cwd(), '.codex-studio', 'secrets.local.json');
const SECRET_PATTERNS = [
  /sk-[A-Za-z0-9_\-]{12,}/g,
  /OPENAI_API_KEY\s*[:=]\s*["']?[^"'\s]+/gi,
];

function getSecretFilePath(env = process.env) {
  const override = typeof env.CODEX_STUDIO_LOCAL_SECRET_FILE === 'string' && env.CODEX_STUDIO_LOCAL_SECRET_FILE.trim()
    ? env.CODEX_STUDIO_LOCAL_SECRET_FILE.trim()
    : '';
  return override ? path.resolve(process.cwd(), override) : SECRET_FILE;
}

function readLocalSecret(env = process.env) {
  const parsed = readLocalSecretConfig(env);
  if (typeof parsed.openaiApiKey === 'string' && parsed.openaiApiKey.trim()) return parsed.openaiApiKey.trim();
  if (typeof parsed.OPENAI_API_KEY === 'string' && parsed.OPENAI_API_KEY.trim()) return parsed.OPENAI_API_KEY.trim();
  return null;
}

function readLocalSecretConfig(env = process.env) {
  try {
    const parsed = JSON.parse(fs.readFileSync(getSecretFilePath(env), 'utf8'));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function getApiKeyInfo(env = process.env) {
  const envKey = typeof env.OPENAI_API_KEY === 'string' && env.OPENAI_API_KEY.trim() ? env.OPENAI_API_KEY.trim() : null;
  const ignoreLocalSecrets = String(env.CODEX_STUDIO_IGNORE_LOCAL_SECRETS || '').trim() === '1';
  const localKey = envKey || ignoreLocalSecrets ? null : readLocalSecret(env);
  const key = envKey || localKey || null;
  return {
    configured: Boolean(key),
    key,
    apiKeySource: envKey ? 'env:OPENAI_API_KEY' : (localKey ? 'localIgnoredSecret' : 'none'),
    keyPresent: Boolean(key),
    keyLast4: key ? key.slice(-4) : null,
    secretFile: getSecretFilePath(env),
    storeRoot: STORE_ROOT,
    pluginHasApiKey: false,
  };
}

function redactString(value) {
  let text = String(value == null ? '' : value);
  for (const pattern of SECRET_PATTERNS) text = text.replace(pattern, '[redacted-api-key]');
  const keyInfo = getApiKeyInfo();
  if (keyInfo.key) text = text.split(keyInfo.key).join('[redacted-api-key]');
  return text;
}

function redact(value, depth = 0) {
  if (depth > 8) return '[MaxDepth]';
  if (value == null) return value;
  if (typeof value === 'string') return redactString(value);
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));
  const output = {};
  for (const [key, raw] of Object.entries(value)) {
    const lower = key.toLowerCase();
    if (lower.includes('token') || lower.includes('secret') || lower.includes('apikey') || lower.includes('api_key') || lower === 'authorization' || lower === 'cookie' || lower === 'password') {
      output[key] = '[redacted]';
    } else {
      output[key] = redact(raw, depth + 1);
    }
  }
  return output;
}

function assertNoSecretText(text, label = 'text') {
  const keyInfo = getApiKeyInfo();
  if (keyInfo.key && String(text || '').includes(keyInfo.key)) {
    return { ok: false, label, reason: 'liveApiKeyValueFound' };
  }
  if (/sk-[A-Za-z0-9_\-]{12,}/.test(String(text || ''))) {
    return { ok: false, label, reason: 'apiKeyPatternFound' };
  }
  return { ok: true, label };
}

module.exports = {
  SECRET_FILE,
  assertNoSecretText,
  getApiKeyInfo,
  getSecretFilePath,
  readLocalSecretConfig,
  redact,
  redactString,
};
