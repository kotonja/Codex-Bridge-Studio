'use strict';

const { runSelfCheck } = require('../bridge/memory/self-check');

console.log(JSON.stringify(runSelfCheck(), null, 2));
