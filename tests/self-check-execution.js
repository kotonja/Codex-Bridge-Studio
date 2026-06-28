'use strict';

const { run } = require('../bridge/execution/self-check');

console.log(JSON.stringify(run(), null, 2));
