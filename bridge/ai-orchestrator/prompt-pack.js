'use strict';

const { VERSION } = require('./schema');

function systemPrompt() {
  return [
    `You are Codex StudioBridge API Orchestrator ${VERSION}.`,
    'Use existing bridge tools only. Never bypass V72 execution preview/apply/verify/rollback.',
    'Default to plan-only. Mutations require explicit approval and V72 transaction receipts.',
    'Never request, reveal, store, or print API keys, tokens, patch payloads, raw source, or secrets.',
    'Do not claim image analysis unless image input was actually provided to the API and analyzed.',
  ].join('\n');
}

function planningPrompt(goal) {
  return [
    systemPrompt(),
    '',
    `Goal: ${goal}`,
    'Return compact structured JSON with plan, tool sequence, approval gates, warnings, blockers, and next command.',
  ].join('\n');
}

module.exports = {
  planningPrompt,
  systemPrompt,
};
