'use strict';

const { VERSION, nowIso } = require('./schema');
const { TOOL_CATALOG, toolEntry } = require('./tool-catalog');

function functionSchema(raw) {
  const tool = toolEntry(raw);
  const parameters = {
    type: 'object',
    additionalProperties: false,
    properties: {
      goal: { type: 'string', description: 'Production goal or target description.' },
      transactionId: { type: 'string', description: 'V72 transaction id when verifying or rolling back.' },
      approved: { type: 'boolean', description: 'True only after explicit AI run approval gate.' },
    },
    required: tool.name.startsWith('execute_verify') || tool.name.startsWith('execute_rollback') ? ['transactionId'] : ['goal'],
  };
  return {
    type: 'function',
    name: tool.name,
    description: `${tool.description} Safety: ${tool.safetyClass}.`,
    parameters,
    strict: true,
    safetyClass: tool.safetyClass,
    mutating: tool.mutating,
    requiresApproval: tool.requiresApproval,
    timeoutMs: tool.timeoutMs,
    outputContract: tool.outputContract,
  };
}

function getFunctionSchemas() {
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    schemas: TOOL_CATALOG.map(functionSchema),
    nextCommand: 'tools\\bridge.cmd ai tools',
  };
}

module.exports = {
  functionSchema,
  getFunctionSchemas,
};
