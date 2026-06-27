'use strict';

const { VERSION, nowIso } = require('./schema');

function createEvidencePack(goal) {
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal,
    evidenceTargets: [
      { id: 'outputBaseline', command: 'tools\\bridge.cmd baseline mark', freshness: 'current' },
      { id: 'watchSnapshot', command: 'tools\\bridge.cmd watch now', freshness: 'live' },
      { id: 'testSnapshot', command: 'tools\\bridge.cmd test snapshot', freshness: 'live when Play/Test is active' },
      { id: 'visualCritique', command: `tools\\bridge.cmd visual critique "${goal}"`, freshness: 'structured or screenshot evidence' },
      { id: 'launchScore', command: `tools\\bridge.cmd qa launch "${goal}"`, freshness: 'plan plus observed evidence if available' },
    ],
  };
}

module.exports = { createEvidencePack };
