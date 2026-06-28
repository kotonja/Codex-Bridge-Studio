'use strict';

const { VERSION, DEFAULT_MODEL, nowIso } = require('./schema');
const { getApiKeyInfo } = require('./secret-policy');

const MODELS = [
  { id: DEFAULT_MODEL, role: 'default', bestFor: 'fast structured production planning and tool routing' },
  { id: 'gpt-4.1', role: 'stronger', bestFor: 'higher fidelity planning when latency/cost is acceptable' },
  { id: 'gpt-4.1-mini', role: 'balanced', bestFor: 'default bridge orchestration' },
  { id: 'gpt-4o-mini', role: 'visual-ready-fallback', bestFor: 'future V74+ reference workflows if enabled' },
];

function getModelCatalog() {
  const keyInfo = getApiKeyInfo();
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    configured: keyInfo.configured,
    defaultModel: DEFAULT_MODEL,
    models: MODELS,
    warnings: keyInfo.configured ? [] : ['Model catalog is local; live model availability requires OPENAI_API_KEY.'],
    blockers: [],
    nextCommand: 'tools\\bridge.cmd ai plan "premium anime dungeon hub"',
  };
}

module.exports = {
  MODELS,
  getModelCatalog,
};
