'use strict';

const fs = require('node:fs');
const https = require('node:https');
const path = require('node:path');
const { VERSION, nowIso } = require('./schema');
const { getApiKeyInfo, getSecretFilePath, readLocalSecretConfig, redactString } = require('./secret-policy');

const API_HOST = process.env.CODEX_STUDIO_OPENAI_API_HOST || 'api.openai.com';
const DEFAULT_TIMEOUT_MS = Number(process.env.CODEX_STUDIO_AI_TLS_TIMEOUT_MS || 8000);
const MAX_CA_BYTES = Number(process.env.CODEX_STUDIO_MAX_EXTRA_CA_BYTES || 1024 * 1024);

const TLS_CERT_ERROR_CODES = new Set([
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'CERT_HAS_EXPIRED',
  'ERR_TLS_CERT_ALTNAME_INVALID',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
]);

function safeRemediation() {
  return [
    'Update Node/Windows trusted certificates if outdated.',
    'If behind a proxy or security product, export the trusted root CA as PEM and configure NODE_EXTRA_CA_CERTS or .codex-studio/secrets.local.json extraCaCerts.',
    'Do not use NODE_TLS_REJECT_UNAUTHORIZED=0.',
  ];
}

function nodeTlsRejectUnauthorizedDisabled(env = process.env) {
  return String(env.NODE_TLS_REJECT_UNAUTHORIZED || '').trim() === '0';
}

function classifyError(error = {}) {
  if (error.name === 'AbortError' || error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') return 'timeout';
  if (TLS_CERT_ERROR_CODES.has(error.code)) return 'tlsCertificateError';
  if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') return 'dnsError';
  if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET' || error.code === 'EPIPE') return 'networkError';
  return 'requestError';
}

function summarizeError(error = {}) {
  const parts = [error.code || error.name || 'requestError'];
  if (error.message) parts.push(error.message);
  return redactString(parts.join(': ')).slice(0, 500);
}

function validateExtraCaCerts(env = process.env) {
  const localConfig = readLocalSecretConfig(env);
  const rawLocalPath = typeof localConfig.extraCaCerts === 'string' ? localConfig.extraCaCerts.trim() : '';
  const envExtra = typeof env.NODE_EXTRA_CA_CERTS === 'string' && env.NODE_EXTRA_CA_CERTS.trim()
    ? env.NODE_EXTRA_CA_CERTS.trim()
    : '';
  const report = {
    secretFile: path.relative(process.cwd(), getSecretFilePath(env)),
    nodeExtraCaCertsSet: Boolean(envExtra),
    nodeExtraCaCertsPath: envExtra || null,
    localExtraCaCertsConfigured: Boolean(rawLocalPath),
    localExtraCaCertsPath: rawLocalPath || null,
    loadedLocalExtraCaCerts: false,
    byteSize: null,
    warnings: [],
    blockers: [],
  };
  if (!rawLocalPath) return { ...report, ca: null };
  const absolute = path.resolve(process.cwd(), rawLocalPath);
  report.localExtraCaCertsPath = absolute;
  if (!fs.existsSync(absolute)) {
    report.blockers.push(`extraCaCerts path does not exist: ${absolute}`);
    return { ...report, ca: null };
  }
  const stats = fs.statSync(absolute);
  if (!stats.isFile()) {
    report.blockers.push(`extraCaCerts path is not a file: ${absolute}`);
    return { ...report, ca: null };
  }
  report.byteSize = stats.size;
  if (stats.size > MAX_CA_BYTES) {
    report.blockers.push(`extraCaCerts file is ${stats.size} bytes; maximum allowed is ${MAX_CA_BYTES} bytes.`);
    return { ...report, ca: null };
  }
  const text = fs.readFileSync(absolute, 'utf8');
  if (/PRIVATE KEY/i.test(text)) {
    report.blockers.push('extraCaCerts file appears to contain private key material; provide only public root/intermediate CA certificates.');
    return { ...report, ca: null };
  }
  if (!/BEGIN CERTIFICATE/.test(text)) {
    report.warnings.push('extraCaCerts file does not look like PEM certificate text.');
  }
  report.loadedLocalExtraCaCerts = true;
  return { ...report, ca: text };
}

function requestOpenAi({ method = 'GET', apiPath = '/v1/models', body = null, headers = {}, timeoutMs = DEFAULT_TIMEOUT_MS, apiKey = null } = {}) {
  return new Promise((resolve) => {
    const caStatus = validateExtraCaCerts();
    if (nodeTlsRejectUnauthorizedDisabled()) {
      resolve({
        ok: false,
        errorType: 'unsafeTlsDisabled',
        errorSummary: 'NODE_TLS_REJECT_UNAUTHORIZED=0 is set; refusing to make API requests with TLS verification disabled.',
        caStatus,
      });
      return;
    }
    if (caStatus.blockers.length) {
      resolve({
        ok: false,
        errorType: 'extraCaCertsInvalid',
        errorSummary: caStatus.blockers[0],
        caStatus,
      });
      return;
    }
    const payload = body == null ? null : (typeof body === 'string' ? body : JSON.stringify(body));
    const requestHeaders = {
      Accept: 'application/json',
      ...headers,
    };
    if (payload != null) {
      requestHeaders['Content-Type'] = requestHeaders['Content-Type'] || 'application/json';
      requestHeaders['Content-Length'] = Buffer.byteLength(payload);
    }
    if (apiKey) requestHeaders.Authorization = `Bearer ${apiKey}`;
    const req = https.request({
      hostname: API_HOST,
      path: apiPath,
      method,
      timeout: timeoutMs,
      headers: requestHeaders,
      ca: caStatus.ca || undefined,
    }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let json = null;
        try {
          json = text ? JSON.parse(text) : null;
        } catch {
          json = null;
        }
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          statusCode: res.statusCode,
          headers: res.headers,
          text,
          json,
          caStatus,
        });
      });
    });
    req.on('timeout', () => {
      req.destroy(Object.assign(new Error('OpenAI API request timed out.'), { code: 'ETIMEDOUT' }));
    });
    req.on('error', (error) => {
      resolve({
        ok: false,
        errorType: classifyError(error),
        errorCode: error.code || null,
        errorSummary: summarizeError(error),
        caStatus,
      });
    });
    if (payload != null) req.write(payload);
    req.end();
  });
}

async function getConnectivityReport(options = {}) {
  const keyInfo = getApiKeyInfo(options.env || process.env);
  const caStatus = validateExtraCaCerts(options.env || process.env);
  const report = {
    ok: false,
    version: VERSION,
    at: nowIso(),
    status: 'unknown',
    provider: 'openai',
    host: API_HOST,
    nodeVersion: process.version,
    apiConfigured: Boolean(keyInfo.configured),
    apiKey: {
      present: Boolean(keyInfo.keyPresent),
      source: keyInfo.apiKeySource,
      redacted: keyInfo.keyPresent ? '[redacted]' : null,
    },
    tls: {
      verified: false,
      status: 'notChecked',
      nodeTlsRejectUnauthorizedDisabled: nodeTlsRejectUnauthorizedDisabled(options.env || process.env),
      nodeExtraCaCertsSet: Boolean(caStatus.nodeExtraCaCertsSet),
    },
    extraCaCerts: {
      configured: Boolean(caStatus.localExtraCaCertsConfigured),
      nodeExtraCaCertsSet: Boolean(caStatus.nodeExtraCaCertsSet),
      loadedLocalExtraCaCerts: Boolean(caStatus.loadedLocalExtraCaCerts),
      byteSize: caStatus.byteSize,
      warnings: caStatus.warnings,
      blockers: caStatus.blockers,
    },
    httpStatus: null,
    errorType: null,
    errorSummary: null,
    warnings: [],
    blockers: [],
    safeRemediation: [],
    nextCommand: 'tools\\bridge.cmd ai tls-check',
  };
  if (report.tls.nodeTlsRejectUnauthorizedDisabled) {
    report.status = 'unsafeTlsDisabled';
    report.errorType = 'unsafeTlsDisabled';
    report.blockers.push('NODE_TLS_REJECT_UNAUTHORIZED=0 is set. StudioBridge refuses to use unsafe TLS bypass mode.');
    report.safeRemediation = safeRemediation();
    return report;
  }
  if (caStatus.blockers.length) {
    report.status = 'extraCaCertsInvalid';
    report.errorType = 'extraCaCertsInvalid';
    report.blockers.push(...caStatus.blockers);
    report.safeRemediation = safeRemediation();
    return report;
  }

  const response = await requestOpenAi({
    method: 'GET',
    apiPath: '/v1/models',
    timeoutMs: Number(options.timeoutMs || DEFAULT_TIMEOUT_MS),
    apiKey: keyInfo.key || null,
  });
  if (response.statusCode) {
    report.httpStatus = response.statusCode;
    report.tls.verified = true;
    report.tls.status = 'verified';
    if (!keyInfo.configured && (response.statusCode === 401 || response.statusCode === 403)) {
      report.ok = true;
      report.status = 'notConfigured';
      report.warnings.push('OPENAI_API_KEY is not configured; TLS reached the API host and authentication was expected to fail.');
      report.nextCommand = 'Set OPENAI_API_KEY or .codex-studio/secrets.local.json openaiApiKey, then rerun tools\\bridge.cmd ai tls-check.';
      return report;
    }
    if (keyInfo.configured && (response.statusCode === 401 || response.statusCode === 403)) {
      report.status = 'authError';
      report.errorType = 'authError';
      report.blockers.push(`OpenAI API returned HTTP ${response.statusCode}; check the configured API key without printing it.`);
      return report;
    }
    if (!response.ok) {
      report.status = 'apiResponseError';
      report.errorType = 'apiResponseError';
      report.blockers.push(`OpenAI API returned HTTP ${response.statusCode}.`);
      return report;
    }
    report.ok = true;
    report.status = 'ok';
    report.nextCommand = 'tools\\bridge.cmd dashboard image-analyze <referenceId-or-imagePath>';
    return report;
  }

  report.status = response.errorType || 'requestError';
  report.errorType = response.errorType || 'requestError';
  report.errorSummary = response.errorSummary || null;
  report.tls.status = response.errorType === 'tlsCertificateError' ? 'failed' : 'unknown';
  report.blockers.push(response.errorSummary || 'OpenAI API connectivity check failed.');
  if (response.errorType === 'tlsCertificateError') report.safeRemediation = safeRemediation();
  return report;
}

function getConnectivitySummary(env = process.env) {
  const keyInfo = getApiKeyInfo(env);
  const caStatus = validateExtraCaCerts(env);
  const unsafe = nodeTlsRejectUnauthorizedDisabled(env);
  return {
    ok: !unsafe && caStatus.blockers.length === 0,
    version: VERSION,
    at: nowIso(),
    status: unsafe ? 'unsafeTlsDisabled' : (caStatus.blockers.length ? 'extraCaCertsInvalid' : (keyInfo.configured ? 'configuredPendingCheck' : 'notConfigured')),
    apiConfigured: Boolean(keyInfo.configured),
    apiKeyPresent: Boolean(keyInfo.keyPresent),
    apiKeySource: keyInfo.apiKeySource,
    actualVisionUsed: false,
    tls: {
      nodeTlsRejectUnauthorizedDisabled: unsafe,
      nodeExtraCaCertsSet: Boolean(caStatus.nodeExtraCaCertsSet),
    },
    extraCaCerts: {
      configured: Boolean(caStatus.localExtraCaCertsConfigured),
      loadedLocalExtraCaCerts: Boolean(caStatus.loadedLocalExtraCaCerts),
      byteSize: caStatus.byteSize,
      warnings: caStatus.warnings,
      blockers: caStatus.blockers,
    },
    warnings: [
      ...(keyInfo.configured ? [] : ['OPENAI_API_KEY is not configured; image analysis uses metadataOnly fallback.']),
      ...(unsafe ? ['NODE_TLS_REJECT_UNAUTHORIZED=0 is unsafe and blocked.'] : []),
      ...caStatus.warnings,
    ],
    blockers: [
      ...(unsafe ? ['NODE_TLS_REJECT_UNAUTHORIZED=0 disables TLS verification and is not allowed.'] : []),
      ...caStatus.blockers,
    ],
    nextCommand: 'tools\\bridge.cmd ai tls-check',
  };
}

module.exports = {
  API_HOST,
  DEFAULT_TIMEOUT_MS,
  MAX_CA_BYTES,
  getConnectivityReport,
  getConnectivitySummary,
  requestOpenAi,
  safeRemediation,
  validateExtraCaCerts,
};
