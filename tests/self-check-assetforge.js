'use strict';

const { run } = require('../bridge/assetforge/self-check');

try {
  console.log(JSON.stringify(run(), null, 2));
} catch (error) {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
}
