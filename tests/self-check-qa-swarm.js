'use strict';

const QaSwarmSelfCheck = require('../bridge/qa-swarm/self-check');

try {
  const result = QaSwarmSelfCheck.run();
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    error: error && error.message ? error.message : String(error),
    stack: error && error.stack ? error.stack.split('\n').slice(0, 6) : undefined,
  }, null, 2));
  process.exit(1);
}
