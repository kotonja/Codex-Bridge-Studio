'use strict';

const { runSelfCheck } = require('../bridge/dashboard/fidelity-self-check');

if (require.main === module) {
  Promise.resolve(runSelfCheck()).then((result) => {
    console.log(JSON.stringify(result, null, 2));
  }).catch((error) => {
    console.error(error && error.stack ? error.stack : String(error));
    process.exit(1);
  });
}

module.exports = { runSelfCheck };
