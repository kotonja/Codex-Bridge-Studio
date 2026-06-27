'use strict';

const { run } = require('../bridge/worldgen/self-check');

try {
  process.stdout.write(`${JSON.stringify(run(), null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exit(1);
}
