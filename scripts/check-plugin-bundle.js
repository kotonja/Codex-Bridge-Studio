'use strict';

const fs = require('node:fs');
const {
  OUTPUT,
  buildBundle,
  sha256,
  relativeFromRoot,
} = require('./bundle-plugin');

function main() {
  const expected = buildBundle();
  if (!fs.existsSync(OUTPUT)) {
    throw new Error(`Missing bundled plugin: ${relativeFromRoot(OUTPUT)}`);
  }
  const actual = fs.readFileSync(OUTPUT, 'utf8').replace(/\r\n/g, '\n');
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
