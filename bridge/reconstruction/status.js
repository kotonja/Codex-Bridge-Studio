'use strict';

const { CAPABILITIES, SAFETY, base } = require('./schema');

function getStatus() {
  return base({
    capabilities: CAPABILITIES,
    safety: SAFETY,
    nextCommand: 'tools\\bridge.cmd reconstruct infer "haunted mansion exterior reference"',
  });
}

module.exports = {
  getStatus,
};

