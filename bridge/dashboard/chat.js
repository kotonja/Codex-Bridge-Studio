'use strict';

const AiOrchestrator = require('../ai-orchestrator');
const Router = require('../command-router');
const { VERSION, nowIso, redact, safeGoal } = require('./schema');
const ChatHistory = require('./chat-history');
const Timeline = require('./timeline');
const RunHistory = require('./run-history');
const ApprovalQueue = require('./approval-queue');
const { getPreset } = require('./pipeline-presets');

function isDashboardStatusIntent(message = '') {
  const q = String(message || '').toLowerCase();
  return /\b(status|state|timeline|approval|approvals|runs|cost|safety|what can you do|help)\b/.test(q);
}

function localAssistantText(route, preset, apiConfigured) {
  const command = route.nextCommand || (route.exactCommands && route.exactCommands[0]) || 'tools\\bridge.cmd dashboard timeline';
  return [
    `Route: ${route.category}.`,
    `Suggested pipeline: ${preset.id}.`,
    apiConfigured ? 'API is configured for server-side AI routes.' : 'API is not configured; using local fallback/tool planning.',
    `Next: ${command}`,
  ].join(' ');
}

async function runDashboardChat(runtime, body = {}, env = {}) {
  const message = safeGoal(body.message || body.text || body.goal || body.query || 'what can you do next?', 'what can you do next?');
  const userMessage = ChatHistory.addMessage(runtime, 'user', message);
  const route = Router.createRoute(message, { version: VERSION });
  const apiStatus = AiOrchestrator.getStatus();
  const apiConfigured = Boolean(apiStatus.configured);
  const preset = getPreset(message);
  const run = RunHistory.createRun(runtime, {
    kind: 'dashboardChat',
    goal: message,
    route,
    routeCategory: route.category,
    status: 'complete',
    nextCommand: route.nextCommand || (route.exactCommands && route.exactCommands[0]) || 'tools\\bridge.cmd dashboard timeline',
  });

  const toolTimeline = [
    Timeline.appendStep(runtime, {
      label: 'Interpret Intent',
      system: 'dashboardChat',
      status: 'complete',
      command: 'command-router',
      summary: `Routed message to ${route.category}.`,
      completedAt: nowIso(),
      resultPreview: { category: route.category, nextCommand: route.nextCommand },
    }),
    Timeline.appendStep(runtime, {
      label: 'Suggest Pipeline',
      system: 'dashboardChat',
      status: 'complete',
      command: `dashboard pipeline ${preset.id}`,
      summary: `Selected ${preset.id}.`,
      completedAt: nowIso(),
      resultPreview: preset,
    }),
  ];

  let aiPlan = null;
  let actualAiUsed = false;
  let assistantText = localAssistantText(route, preset, apiConfigured);
  if (route.category === 'ai' && apiConfigured) {
    try {
      aiPlan = await AiOrchestrator.getProductionPlan(message, { source: 'dashboard.chat' });
      actualAiUsed = Boolean(aiPlan && aiPlan.actualApiUsed);
      assistantText = `AI orchestrator returned a ${aiPlan.mode || 'plan'} plan. Next: ${aiPlan.nextCommand || route.nextCommand || 'tools\\bridge.cmd ai runs'}`;
    } catch (error) {
      aiPlan = AiOrchestrator.offlinePlan(message, { configured: true, source: 'dashboard.chat.errorFallback' });
      assistantText = `API plan failed safely, so I returned a local fallback plan. Next: ${aiPlan.nextCommand || route.nextCommand}`;
    }
  } else if (route.category === 'ai') {
    aiPlan = AiOrchestrator.offlinePlan(message, { configured: false, source: 'dashboard.chat.localFallback' });
  }

  const approvalRequirements = ApprovalQueue.listApprovals(runtime).approvals;
  const assistant = ChatHistory.addMessage(runtime, 'assistant', assistantText, {
    routeCategory: route.category,
    suggestedPipeline: preset.id,
    runId: run.runId,
  });

  const result = redact({
    ok: true,
    version: VERSION,
    at: nowIso(),
    runId: run.runId,
    userMessage,
    assistantMessage: assistant,
    interpretedIntent: {
      message,
      category: route.category,
      confidence: route.confidence,
      isDashboardStatusIntent: isDashboardStatusIntent(message),
    },
    route,
    routeCategory: route.category,
    suggestedPipeline: preset,
    toolTimeline,
    approvalRequirements,
    api: {
      configured: apiConfigured,
      actualAiUsed,
      keyExposed: false,
      plan: aiPlan,
    },
    warnings: apiConfigured ? [] : ['OPENAI_API_KEY is not configured; dashboard chat used local fallback planning.'],
    blockers: [],
    nextCommand: route.nextCommand || (route.exactCommands && route.exactCommands[0]) || `tools\\bridge.cmd dashboard pipeline "${message}"`,
  });
  RunHistory.updateRun(runtime, run.runId, {
    resultSummary: {
      ok: result.ok,
      routeCategory: result.routeCategory,
      suggestedPipeline: preset.id,
      actualAiUsed,
    },
    warnings: result.warnings,
    blockers: result.blockers,
  });
  return result;
}

module.exports = { runDashboardChat };
