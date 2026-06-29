'use strict';

const { runSelfCheck } = require('../bridge/dashboard/image-self-check');

if (require.main === module) {
  runSelfCheck()
    .then((result) => {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    })
    .catch((error) => {
      process.stderr.write(`${error.stack || error.message || error}\n`);
      process.exit(1);
    });
}

module.exports = { runSelfCheck };
