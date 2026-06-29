'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Connectivity = require('../bridge/ai-orchestrator/connectivity');
const { assertNoSecretText } = require('../bridge/ai-orchestrator/secret-policy');
const ImageClient = require('../bridge/ai-orchestrator/image-client');

async function runSelfCheck() {
  const originalCwd = process.cwd();
  const isolatedRoot = path.join(originalCwd, '.codex-studio', 'tmp', `ai-connectivity-isolated-${Date.now()}`);
  fs.mkdirSync(isolatedRoot, { recursive: true });
  process.chdir(isolatedRoot);
  let withoutKey;
  try {
    withoutKey = await Connectivity.getConnectivityReport({
      env: {
        ...process.env,
        OPENAI_API_KEY: '',
        CODEX_STUDIO_IGNORE_LOCAL_SECRETS: '1',
        NODE_TLS_REJECT_UNAUTHORIZED: '',
      },
      timeoutMs: 6000,
    });
  } finally {
    process.chdir(originalCwd);
  }
  assert.equal(withoutKey.apiConfigured, false, 'tls-check should work without API key');
  assert.equal(withoutKey.apiKey.present, false, 'diagnostic should show key presence as false');
  assert(!JSON.stringify(withoutKey).includes('OPENAI_API_KEY='), 'diagnostic should not print API key assignment text');

  const unsafe = await Connectivity.getConnectivityReport({
    env: {
      ...process.env,
      NODE_TLS_REJECT_UNAUTHORIZED: '0',
    },
  });
  assert.equal(unsafe.status, 'unsafeTlsDisabled');
  assert(unsafe.blockers.some((item) => /NODE_TLS_REJECT_UNAUTHORIZED=0/.test(item)), 'unsafe TLS bypass should be blocked');

  const tempRoot = path.join(originalCwd, '.codex-studio', 'tmp', `ai-connectivity-${Date.now()}`);
  fs.mkdirSync(path.join(tempRoot, '.codex-studio'), { recursive: true });
  const tempSecretFile = path.join(tempRoot, '.codex-studio', 'secrets.local.json');
  fs.writeFileSync(tempSecretFile, JSON.stringify({
    extraCaCerts: 'missing-root-ca.pem',
  }, null, 2));
  const missingCa = await Connectivity.getConnectivityReport({
    env: {
      ...process.env,
      OPENAI_API_KEY: '',
      CODEX_STUDIO_LOCAL_SECRET_FILE: tempSecretFile,
      NODE_TLS_REJECT_UNAUTHORIZED: '',
    },
  });
  assert.equal(missingCa.status, 'extraCaCertsInvalid');
  assert(missingCa.blockers.some((item) => /extraCaCerts path does not exist/.test(item)), 'missing extraCaCerts should return structured error');

  const imageVisionFailure = await ImageClient.requestImageVision({ _absolutePath: 'C:\\path\\that\\does\\not\\exist.png' });
  assert.equal(imageVisionFailure.actualVisionUsed, false, 'image vision failures must not claim actual vision');

  const fakeSecret = 'sk-test_connectivity_self_check_123456789';
  const redaction = assertNoSecretText(JSON.stringify({ diagnostics: withoutKey, fakeSecret }).replace(fakeSecret, '[redacted]'), 'connectivityDiagnostics');
  assert.equal(redaction.ok, true);

  return {
    ok: true,
    checked: [
      'noApiKeyConnectivity',
      'apiKeyPresenceRedacted',
      'unsafeTlsBypassBlocked',
      'missingExtraCaStructuredError',
      'imageVisionFailureActualVisionFalse',
      'noSecretLeak',
    ],
    noKeyStatus: withoutKey.status,
    unsafeStatus: unsafe.status,
    nextCommand: 'tools\\bridge.cmd ai tls-check',
  };
}

if (require.main === module) {
  runSelfCheck()
    .then((result) => {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    })
    .catch((error) => {
      process.stderr.write(`${error.stack || error.message}\n`);
      process.exit(1);
    });
}

module.exports = { runSelfCheck };
