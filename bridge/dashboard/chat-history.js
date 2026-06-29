'use strict';

const { VERSION, nowIso, redact } = require('./schema');

function ensureChat(runtime = {}) {
  if (!Array.isArray(runtime.chatMessages)) runtime.chatMessages = [];
  return runtime.chatMessages;
}

function addMessage(runtime, role, content, extra = {}) {
  const messages = ensureChat(runtime);
  const message = redact({
    messageId: `msg_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 8)}`,
    role,
    content: String(content || ''),
    at: nowIso(),
    ...extra,
  });
  messages.push(message);
  if (messages.length > 120) messages.splice(0, messages.length - 120);
  return message;
}

function listHistory(runtime = {}, limit = 60) {
  const messages = ensureChat(runtime);
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    count: messages.length,
    messages: messages.slice(Math.max(0, messages.length - Number(limit || 60))),
    warnings: [],
    blockers: [],
    nextCommand: 'tools\\bridge.cmd dashboard chat "what can you do next?"',
  };
}

function clearHistory(runtime = {}) {
  runtime.chatMessages = [];
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    cleared: true,
    warnings: [],
    blockers: [],
    nextCommand: 'tools\\bridge.cmd dashboard chat "what can you do next?"',
  };
}

module.exports = {
  addMessage,
  clearHistory,
  ensureChat,
  listHistory,
};
