'use strict';

const ArchitectureSelfCheck = require('../bridge/architecture/self-check');

console.log(JSON.stringify(ArchitectureSelfCheck.run(), null, 2));
