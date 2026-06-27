'use strict';

const fs = require('node:fs');
const path = require('node:path');
const childProcess = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function runNode(args) {
  const result = childProcess.spawnSync(process.execPath, args, {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 30000,
  });
  if (result.status !== 0) {
    throw new Error(`${process.execPath} ${args.join(' ')} failed\n${result.stdout}\n${result.stderr}`);
  }
  return JSON.parse(result.stdout);
}

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function main() {
  const requiredFiles = [
    'scripts/bundle-plugin.js',
    'scripts/check-plugin-bundle.js',
    'plugin/src/main.lua',
    'plugin/src/legacy/CodexStudioBridge.legacy.lua',
  ];
  for (const file of requiredFiles) {
    assert(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`);
  }

  const bundle = runNode(['scripts/bundle-plugin.js']);
  const check = runNode(['scripts/check-plugin-bundle.js']);
  const pluginPath = path.join(ROOT, 'plugin/CodexStudioBridge.plugin.lua');
  const plugin = read('plugin/CodexStudioBridge.plugin.lua');
  const infoPath = path.join(ROOT, 'plugin/src/generated/bundle-info.json');
  const info = JSON.parse(read('plugin/src/generated/bundle-info.json'));

  assert(fs.existsSync(pluginPath), 'Bundled plugin file does not exist.');
  assert(Buffer.byteLength(plugin, 'utf8') > 500000, 'Bundled plugin is suspiciously tiny.');
  assert(plugin.includes('VERSION = "0.68.0"'), 'Bundled plugin does not contain VERSION = "0.68.0".');
  assert(plugin.includes('bridgeUrl') || plugin.includes('127.0.0.1') || plugin.includes('DEFAULT_PORT'), 'Bundled plugin lacks bridge URL/default port evidence.');
  assert(plugin.includes('/studio/pair') || plugin.toLowerCase().includes('pairing'), 'Bundled plugin lacks pairing endpoint/evidence.');
  assert(plugin.includes('/studio/heartbeat') || plugin.toLowerCase().includes('heartbeat'), 'Bundled plugin lacks heartbeat endpoint/evidence.');
  assert(plugin.includes('/studio/commands') || plugin.toLowerCase().includes('command polling'), 'Bundled plugin lacks command polling endpoint/evidence.');
  assert(plugin.includes('CodexPremiumDirector'), 'Bundled plugin lacks V63 Premium Director references.');
  assert(!plugin.includes('--#include'), 'Bundled plugin still contains include markers.');
  assert(info.sha256 && info.bytes && Array.isArray(info.includedFiles), 'bundle-info.json is missing sha256/bytes/includedFiles.');
  assert(check.ok === true && check.status === 'PASS', 'Bundle checker did not pass.');
  assert(bundle.sha256 === info.sha256, 'bundle-plugin output sha does not match bundle-info.');

  const premium = runNode(['tests/self-check-premium.js']);
  assert(premium.ok === true, 'V63 premium self-check failed.');

  console.log(JSON.stringify({
    ok: true,
    version: '0.68.0',
    bundleBytes: info.bytes,
    bundleSha256: info.sha256,
    includedFileCount: info.includedFiles.length,
    premiumSelfCheck: premium,
  }, null, 2));
}

try {
  main();
} catch (err) {
  console.error(err && err.stack ? err.stack : String(err));
  process.exit(1);
}
