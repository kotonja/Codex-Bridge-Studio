'use strict';

const { runSelfCheck } = require('../bridge/ai-orchestrator/self-check');

runSelfCheck()
  .then((result) => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  })
  .catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exit(1);
  });
