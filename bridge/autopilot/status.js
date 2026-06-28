'use strict';

const { CAPABILITIES, DEFAULT_POLICY, INTEGRATIONS, VERSION, nowIso } = require('./schema');
const { listPolicies } = require('./loop-policy');

function createStatus() {
  return {
    version: VERSION,
    ok: true,
    at: nowIso(),
    capabilities: CAPABILITIES,
    integrations: INTEGRATIONS,
    defaultPolicy: DEFAULT_POLICY,
    policies: listPolicies().map((policy) => ({ id: policy.id, maxRounds: policy.maxRounds, maxMutationsPerRound: policy.maxMutationsPerRound, maxRuntimeMs: policy.maxRuntimeMs })),
    warnings: [],
    blockers: [],
    nextCommand: 'tools\\bridge.cmd autopilot plan "premium anime dungeon hub"',
  };
}

module.exports = { createStatus };
