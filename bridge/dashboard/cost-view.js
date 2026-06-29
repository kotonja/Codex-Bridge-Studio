'use strict';

const AiOrchestrator = require('../ai-orchestrator');
const { VERSION, nowIso, redact } = require('./schema');

function createCostView(runtime = {}) {
  const aiCost = AiOrchestrator.getCostReport();
  const runs = Array.isArray(runtime.runs) ? runtime.runs : [];
  const chatCount = Array.isArray(runtime.chatMessages) ? runtime.chatMessages.length : 0;
  return redact({
    ok: true,
    version: VERSION,
    at: nowIso(),
    configured: Boolean(AiOrchestrator.getStatus().configured),
    frontendHasApiKey: false,
    apiKeyExposed: false,
    dashboardRuns: runs.length,
    chatMessages: chatCount,
    aiCost,
    notes: [
      'Dashboard frontend never receives API keys.',
      'If OPENAI_API_KEY is missing, chat and pipeline use local fallback/tool plans.',
    ],
    warnings: [],
    blockers: [],
    nextCommand: 'tools\\bridge.cmd dashboard chat "plan a premium Roblox scene"',
  });
}

module.exports = { createCostView };
