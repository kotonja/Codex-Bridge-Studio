'use strict';

const https = require('node:https');
const { DEFAULT_MODEL, VERSION, nowIso } = require('./schema');
const { getApiKeyInfo, redact } = require('./secret-policy');
const { estimateForPlan } = require('./cost-tracker');
const { planningPrompt } = require('./prompt-pack');
const { createRunState, updateRun } = require('./run-state');
const Store = require('./run-store');
const { classifyGoal } = require('./safety-policy');
const { getToolCatalog } = require('./tool-catalog');

function offlinePlan(goal, options = {}) {
  const safety = classifyGoal(goal);
  const steps = [
    { id: 'memory', tool: 'memory_recommend', command: `tools\\bridge.cmd memory recommend "${goal}"`, mutating: false },
    { id: 'premium', tool: 'premium_plan', command: `tools\\bridge.cmd premium plan "${goal}"`, mutating: false },
    { id: 'worldgen', tool: 'worldgen_graph', command: `tools\\bridge.cmd worldgen graph "${goal}"`, mutating: false },
    { id: 'assetforge', tool: 'assetforge_kit', command: `tools\\bridge.cmd assetforge kit "${goal}"`, mutating: false },
    { id: 'cinematic', tool: 'cinematic_timeline', command: `tools\\bridge.cmd cinematic timeline "${goal}"`, mutating: false },
    { id: 'executionPreview', tool: 'execute_preview', command: `tools\\bridge.cmd execute preview "${goal}"`, mutating: false },
    { id: 'visualGate', tool: 'visual_critique', command: `tools\\bridge.cmd visual critique "${goal}"`, mutating: false },
    { id: 'qaGate', tool: 'qa_launch', command: `tools\\bridge.cmd qa launch "${goal}"`, mutating: false },
  ];
  return {
    ok: safety.ok,
    version: VERSION,
    at: nowIso(),
    configured: false,
    mode: 'offlineLocalFallbackPlan',
    goal,
    memoryRecommendations: { command: `tools\\bridge.cmd memory recommend "${goal}"` },
    premiumPlan: { command: `tools\\bridge.cmd premium plan "${goal}"` },
    worldgenGraphSuggestion: { command: `tools\\bridge.cmd worldgen graph "${goal}"` },
    assetforgeKitSuggestion: { command: `tools\\bridge.cmd assetforge kit "${goal}"` },
    cinematicMomentSuggestion: { command: `tools\\bridge.cmd cinematic timeline "${goal}"` },
    executePreviewSuggestion: { command: `tools\\bridge.cmd execute preview "${goal}"` },
    visualQaGates: ['visual_critique', 'qa_launch'],
    approvalGates: [
      'AI runs are plan-only by default.',
      'execute_preview must run before execute_apply.',
      'execute_apply must route through V72.',
      'execute_verify must run after apply.',
      'execute_rollback must be available from the receipt.',
    ],
    steps,
    toolCatalog: getToolCatalog().tools.map((tool) => ({ name: tool.name, mutating: tool.mutating, safetyClass: tool.safetyClass })),
    costEstimate: estimateForPlan({ steps }),
    warnings: [
      ...(options.configured ? [] : ['OPENAI_API_KEY is not configured; this is a local fallback plan, not an API response.']),
      ...safety.warnings,
    ],
    blockers: safety.blockers,
    nextCommand: `tools\\bridge.cmd ai run "${goal}"`,
  };
}

function postJson(url, body, apiKey, timeoutMs = 30000) {
  const payload = Buffer.from(JSON.stringify(body), 'utf8');
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'POST',
      timeout: timeoutMs,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': payload.length,
      },
    }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          if (res.statusCode >= 400) reject(new Error(`OpenAI API HTTP ${res.statusCode}: ${parsed.error && parsed.error.message ? parsed.error.message : data.slice(0, 300)}`));
          else resolve(parsed);
        } catch (error) {
          reject(error);
        }
      });
    });
    req.on('timeout', () => req.destroy(new Error('OpenAI API request timed out.')));
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function apiPlan(goal, options = {}) {
  const keyInfo = getApiKeyInfo();
  const fallback = offlinePlan(goal, { ...options, configured: keyInfo.configured });
  if (!keyInfo.configured) return fallback;
  const body = {
    model: options.model || DEFAULT_MODEL,
    input: planningPrompt(goal),
    text: {
      format: {
        type: 'json_schema',
        name: 'codex_studiobridge_ai_plan',
        schema: {
          type: 'object',
          additionalProperties: true,
          properties: {
            summary: { type: 'string' },
            steps: { type: 'array', items: { type: 'object', additionalProperties: true } },
            warnings: { type: 'array', items: { type: 'string' } },
            blockers: { type: 'array', items: { type: 'string' } },
            nextCommand: { type: 'string' },
          },
          required: ['summary', 'steps', 'warnings', 'blockers', 'nextCommand'],
        },
      },
    },
  };
  try {
    const response = await postJson('https://api.openai.com/v1/responses', body, keyInfo.key);
    return {
      ...fallback,
      configured: true,
      mode: 'apiPlan',
      apiResponseId: response.id || null,
      apiResponse: redact(response.output_text || response.output || response),
      warnings: [...fallback.warnings.filter((warning) => !warning.includes('OPENAI_API_KEY')), 'Live API planning response received.'],
      nextCommand: `tools\\bridge.cmd ai run "${goal}"`,
    };
  } catch (error) {
    return {
      ...fallback,
      configured: true,
      mode: 'apiUnavailableFallbackPlan',
      status: 'manualRequired',
      warnings: [...fallback.warnings.filter((warning) => !warning.includes('OPENAI_API_KEY')), `OpenAI API unavailable: ${error.message}`],
      nextCommand: `tools\\bridge.cmd ai plan "${goal}"`,
    };
  }
}

async function createRun(goal, options = {}) {
  const plan = await apiPlan(goal, options);
  const run = updateRun(createRunState(goal, { model: options.model }), {
    status: 'planned',
    steps: plan.steps,
    costEstimate: plan.costEstimate,
    warnings: plan.warnings,
    blockers: plan.blockers,
    plan,
    nextCommand: `tools\\bridge.cmd ai approve ${options.runId || '<runId>'}`,
  });
  run.nextCommand = plan.blockers.length ? `tools\\bridge.cmd ai report ${run.runId}` : `tools\\bridge.cmd ai approve ${run.runId}`;
  Store.saveRun(run);
  Store.saveReport(run.runId, {
    ok: true,
    version: VERSION,
    at: nowIso(),
    runId: run.runId,
    goal,
    status: run.status,
    configured: plan.configured,
    plan,
    warnings: run.warnings,
    blockers: run.blockers,
    nextCommand: run.nextCommand,
  });
  return run;
}

module.exports = {
  apiPlan,
  createRun,
  offlinePlan,
};
