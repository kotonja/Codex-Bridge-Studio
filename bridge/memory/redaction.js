'use strict';

const { REDACTED_KEYS } = require('./schema');

function shouldRedactKey(key = '') {
  const lower = String(key).toLowerCase();
  if (lower.startsWith('stores')) return false;
  return REDACTED_KEYS.some((needle) => lower.includes(String(needle).toLowerCase()));
}

function redactString(value) {
  return String(value)
    .replace(/(x-codex-[a-z-]*token["']?\s*[:=]\s*)["'][^"']+["']/ig, '$1"[redacted]"')
    .replace(/(pairing\s*code["']?\s*[:=]\s*)["']?\d{4,8}["']?/ig, '$1[redacted]')
    .replace(/(sessionToken["']?\s*[:=]\s*)["'][^"']+["']/ig, '$1"[redacted]"');
}

function looksLikeRawSource(value) {
  if (typeof value !== 'string') return false;
  const text = value.trim();
  if (text.length > 500) return true;
  if (text.includes('\n')) return true;
  return /\b(local|function|require|script|Instance\.new|game:GetService)\b/.test(text);
}

function redact(value, depth = 0) {
  if (depth > 8) return '[redacted-depth-limit]';
  if (value == null) return value;
  if (typeof value === 'string') return redactString(value).slice(0, 4000);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.slice(0, 100).map((item) => redact(item, depth + 1));
  if (typeof value === 'object') {
    const out = {};
    for (const [key, inner] of Object.entries(value)) {
      if (String(key).toLowerCase() === 'source' && looksLikeRawSource(inner)) {
        out[key] = '[redacted]';
      } else {
        out[key] = shouldRedactKey(key) ? '[redacted]' : redact(inner, depth + 1);
      }
    }
    return out;
  }
  return String(value);
}

module.exports = { redact, shouldRedactKey, looksLikeRawSource };
