'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  OUTPUT,
  ROOT,
  SRC_DIR,
  buildBundle,
  sha256,
  relativeFromRoot,
} = require('./bundle-plugin');

const BOM_ERROR = 'BOM/U+FEFF detected; Roblox Lua will fail to parse this plugin.';

function toPosix(value) {
  return value.replace(/\\/g, '/');
}

function locateIndex(text, index) {
  const before = text.slice(0, index);
  const lines = before.split('\n');
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
}

function assertNoFeffInText(text, filePath) {
  const index = text.indexOf('\ufeff');
  if (index === -1) {
    return;
  }
  const location = locateIndex(text, index);
  throw new Error(`${BOM_ERROR} ${relativeFromRoot(filePath)}:${location.line}:${location.column}`);
}

function assertNoFeffInBuffer(buffer, filePath) {
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    throw new Error(`${BOM_ERROR} ${relativeFromRoot(filePath)}:1:1`);
  }
  assertNoFeffInText(buffer.toString('utf8'), filePath);
}

function walkLuaFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) {
    return out;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkLuaFiles(fullPath));
    } else if (entry.isFile() && toPosix(fullPath).endsWith('.lua')) {
      out.push(fullPath);
    }
  }
  return out;
}

function main() {
  const expected = buildBundle();
  if (!fs.existsSync(OUTPUT)) {
    throw new Error(`Missing bundled plugin: ${relativeFromRoot(OUTPUT)}`);
  }
  const actualBuffer = fs.readFileSync(OUTPUT);
  assertNoFeffInBuffer(actualBuffer, OUTPUT);
  for (const file of walkLuaFiles(SRC_DIR)) {
    assertNoFeffInBuffer(fs.readFileSync(file), file);
  }
  const actual = actualBuffer.toString('utf8').replace(/\r\n/g, '\n');
  const actualBytes = Buffer.byteLength(actual, 'utf8');
  const actualSha = sha256(actual);
  const ok = actual === expected.content;
  const report = {
    ok,
    status: ok ? 'PASS' : 'STALE',
    version: expected.version,
    output: expected.output,
    bytes: actualBytes,
    expectedBytes: expected.bytes,
    sha256: actualSha,
    expectedSha256: expected.sha256,
    includedFiles: expected.includedFiles,
  };
  console.log(JSON.stringify(report, null, 2));
  if (!ok) {
    process.exit(1);
  }
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(err && err.stack ? err.stack : String(err));
    process.exit(1);
  }
}
