'use strict';

const { run } = require('../bridge/autopilot/self-check');

try {
  console.log(JSON.stringify(run(), null, 2));
} catch (error) {
  console.error(error.stack || error.message);
  process.exit(1);
}
