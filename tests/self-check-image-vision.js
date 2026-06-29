'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const childProcess = require('node:child_process');
const ReferenceLab = require('../bridge/reference-lab');
const WorldCompiler = require('../bridge/world-compiler');
const CommandRouter = require('../bridge/command-router');
const SecretPolicy = require('../bridge/ai-orchestrator/secret-policy');
const { VERSION } = require('../bridge/reference-lab/schema');

const TINY_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=';

function tmpImagePath() {
  const dir = path.join(process.cwd(), '.codex-studio', 'tmp');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'v78-tiny-reference.png');
  fs.writeFileSync(file, Buffer.from(TINY_PNG_BASE64, 'base64'));
  return file;
}

function assertNoRawOrSecret(value, label) {
  const json = JSON.stringify(value);
  assert(!json.includes(TINY_PNG_BASE64), `${label} leaked raw image base64`);
  assert(!json.includes('iVBORw0KGgo'), `${label} leaked PNG base64 prefix`);
  const secretCheck = SecretPolicy.assertNoSecretText(json, label);
  assert(secretCheck.ok, `${label} leaked API key: ${secretCheck.reason}`);
}

async function run() {
  const missing = await ReferenceLab.analyzeImageFile(path.join(process.cwd(), '.codex-studio', 'tmp', 'missing-v78-image.png'), { allowApi: false });
  assert.equal(missing.version, VERSION);
  assert.equal(missing.mode, 'unavailable');
  assert.equal(missing.available, false);
  assert.equal(missing.actualVisionUsed, false);
  assert(missing.nextCommand.includes('valid-local-image-path'));
  assertNoRawOrSecret(missing, 'missing image report');

  const imagePath = tmpImagePath();
  const metadataOnly = await ReferenceLab.analyzeImageFile(imagePath, { allowApi: false });
  assert.equal(metadataOnly.version, VERSION);
  assert.equal(metadataOnly.mode, 'metadataOnly');
  assert.equal(metadataOnly.available, true);
  assert.equal(metadataOnly.actualVisionUsed, false);
  assert.equal(metadataOnly.rawBytesStored, false);
  assert.equal(metadataOnly.imageMetadata.extension, '.png');
  assert(metadataOnly.imageMetadata.byteSize > 0, 'metadata byte size missing');
  assert.match(metadataOnly.imageMetadata.sha256, /^[a-f0-9]{64}$/);
  assert(metadataOnly.imageMetadata.dimensions && metadataOnly.imageMetadata.dimensions.width === 1, 'PNG dimensions were not parsed');
  assertNoRawOrSecret(metadataOnly, 'metadata-only image report');

  const worldImage = await WorldCompiler.getWorldCompilerImageReport(imagePath, { allowApi: false });
  assert.equal(worldImage.version, VERSION);
  assert.equal(worldImage.actualVisionUsed, false);
  assert.equal(worldImage.createdNothingYet, true);
  assert.equal(worldImage.requiresExecuteApply, true);
  assert(worldImage.imageAnalysis, 'worldcompile image analysis missing');
  assert(worldImage.compile, 'worldcompile compile summary missing');
  assert(worldImage.package, 'worldcompile package missing');
  assert(worldImage.executePreview, 'worldcompile execution preview missing');
  assertNoRawOrSecret(worldImage, 'worldcompile image report');

  const routes = {
    'analyze image file': 'reference',
    'reference image file': 'reference',
    'worldcompile image': 'worldcompile',
    'image to world': 'worldcompile',
    'turn this image into a world': 'worldcompile',
    'build from this image': 'worldcompile',
    'use api': 'ai',
    'build this for real': 'execution',
    'infer the inside': 'reconstruction',
    'analyze this reference': 'reference',
    'new pairing code': 'pairing',
  };
  for (const [query, expected] of Object.entries(routes)) {
    const route = CommandRouter.createRoute(query);
    assert.equal(route.category, expected, `${query} routed to ${route.category}, expected ${expected}`);
  }

  childProcess.execFileSync(process.execPath, ['scripts/check-no-bom.js'], { stdio: 'pipe' });

  return {
    ok: true,
    version: VERSION,
    checks: {
      missingPath: { mode: missing.mode, available: missing.available, actualVisionUsed: missing.actualVisionUsed },
      metadataOnly: {
        mode: metadataOnly.mode,
        available: metadataOnly.available,
        apiConfigured: metadataOnly.apiConfigured,
        actualVisionUsed: metadataOnly.actualVisionUsed,
        extension: metadataOnly.imageMetadata.extension,
        byteSize: metadataOnly.imageMetadata.byteSize,
        sha256: metadataOnly.imageMetadata.sha256,
      },
      worldcompileImage: {
        mode: worldImage.mode,
        actualVisionUsed: worldImage.actualVisionUsed,
        hasCompile: Boolean(worldImage.compile),
        hasPackage: Boolean(worldImage.package),
        hasExecutePreview: Boolean(worldImage.executePreview),
      },
      router: routes,
      noBom: 'pass',
      noRawImageBytesStored: true,
      noSecretLeak: true,
    },
  };
}

if (require.main === module) {
  run()
    .then((result) => {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    })
    .catch((error) => {
      process.stderr.write(`${error.stack || error.message}\n`);
      process.exit(1);
    });
}

module.exports = { run };
