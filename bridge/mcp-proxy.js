'use strict';

const childProcess = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const Execution = require('./execution');
const Memory = require('./memory');
const AiOrchestrator = require('./ai-orchestrator');
const ReferenceLab = require('./reference-lab');
const Reconstruction = require('./reconstruction');
const WorldCompiler = require('./world-compiler');
const Fidelity = require('./fidelity');
const Dashboard = require('./dashboard');

const VERSION = '0.84.0';
const ROOT = path.resolve(__dirname, '..');
const BASE_URL = process.env.CODEX_STUDIO_BRIDGE_URL || `http://127.0.0.1:${process.env.CODEX_STUDIO_BRIDGE_PORT || 28123}`;
const SERVER_SCRIPT = path.join(ROOT, 'bridge', 'server.js');
const SUPERVISOR_SCRIPT = path.join(ROOT, 'bridge', 'supervisor.js');
const LOG_DIR = path.join(ROOT, '.codex-studio', 'mcp-proxy');
const DEFAULT_READ_TIMEOUT_MS = Number(process.env.CODEX_STUDIO_MCP_PROXY_HTTP_MS || 2500);
const DEFAULT_COMMAND_TIMEOUT_MS = Number(process.env.CODEX_STUDIO_MCP_PROXY_COMMAND_MS || 20000);
const TERMINAL_STATUSES = new Set(['executed', 'failed', 'rejected', 'blockedExternalRisk', 'cancelledByPairReset', 'duplicateIgnored']);

function nowIso() {
  return new Date().toISOString();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeJson(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify({ ok: false, error: 'JSON serialization failed.' });
  }
}

function redacted(value, depth = 0) {
  if (depth > 7) return '[MaxDepth]';
  if (value === null || value === undefined) return value === undefined ? null : value;
  if (typeof value === 'string') return value.length > 1500 ? `${value.slice(0, 1500)}...[truncated ${value.length}]` : value;
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.slice(0, 80).map((item) => redacted(item, depth + 1));
  const output = {};
  for (const [key, raw] of Object.entries(value)) {
    const lower = key.toLowerCase();
    if (lower.includes('token') || lower === 'source' || lower === 'newsource' || lower === 'oldsource' || lower === 'payload' || lower.includes('patch')) {
      output[key] = '[redacted]';
    } else {
      output[key] = redacted(raw, depth + 1);
    }
  }
  return output;
}

function compactPlace(place) {
  if (!place || typeof place !== 'object') return null;
  return {
    studioId: place.studioId,
    placeId: place.placeId,
    placeName: place.placeName,
    gameId: place.gameId,
    runtimeMode: place.runtimeMode,
    connected: place.connected,
    stale: place.stale,
    heartbeatAgeMs: place.heartbeatAgeMs,
    pluginVersion: place.pluginVersion,
    commandQueueLength: place.commandQueueLength,
  };
}

function compactHealth(health) {
  if (!health || typeof health !== 'object') return health || null;
  return {
    ok: health.ok,
    version: health.version,
    paired: health.paired,
    studioConnected: health.studioConnected,
    pairingCode: health.pairingCode,
    activeStudioId: health.activeStudioId,
    activePlace: compactPlace(health.activePlace),
    connectedPlaces: Array.isArray(health.places)
      ? health.places.filter((place) => place.connected && !place.stale).map(compactPlace)
      : [],
    awareness: health.awareness ? {
      fresh: health.awareness.fresh,
      activeContextType: health.awareness.activeContextType,
      latestAgeMs: health.awareness.latestAgeMs,
      bufferSize: health.awareness.bufferSize,
    } : null,
    supervisor: health.supervisor ? {
      running: health.supervisor.running,
      heartbeatAgeMs: health.supervisor.heartbeatAgeMs,
      mcpDuplicateCount: health.supervisor.mcpDuplicateCount,
    } : null,
  };
}

function compactPlaces(places) {
  if (!places || typeof places !== 'object') return places || null;
  return {
    ok: places.ok,
    version: places.version,
    activeStudioId: places.activeStudioId,
    activePlaceId: places.activePlaceId,
    connectedCount: places.connectedCount,
    places: Array.isArray(places.places) ? places.places.map(compactPlace) : [],
  };
}

function compactTransport(transport) {
  if (!transport || typeof transport !== 'object') return transport || null;
  return {
    ok: transport.ok,
    version: transport.version,
    status: transport.status,
    studioMcp: transport.studioMcp ? {
      ok: transport.studioMcp.ok,
      studios: transport.studioMcp.studios,
      proxies: transport.studioMcp.proxies,
      toolsCached: transport.studioMcp.toolsCached,
      error: transport.studioMcp.error,
    } : null,
    studioBridge: transport.studioBridge ? {
      localBridgeHealthy: transport.studioBridge.localBridgeHealthy,
      activeStudioId: transport.studioBridge.activeStudioId,
      placeCount: transport.studioBridge.placeCount,
      connectedPlaces: Array.isArray(transport.studioBridge.connectedPlaces)
        ? transport.studioBridge.connectedPlaces.map(compactPlace)
        : [],
    } : null,
    diagnostics: transport.diagnostics || null,
    codexInternalMcp: transport.codexInternalMcp ? {
      likelyFailureWhenToolSaysTransportClosed: transport.codexInternalMcp.likelyFailureWhenToolSaysTransportClosed,
      canLocalBridgeReopenPrivateSocket: transport.codexInternalMcp.canLocalBridgeReopenPrivateSocket,
      recovery: transport.codexInternalMcp.recovery,
    } : null,
    nextCommand: transport.nextCommand,
  };
}

function compactContext(context) {
  if (!context || typeof context !== 'object') return context || null;
  return {
    ok: context.ok,
    version: context.version,
    mode: context.mode,
    connection: context.connection ? {
      paired: context.connection.paired,
      studioConnected: context.connection.studioConnected,
      pluginVersion: context.connection.pluginVersion,
      versionMatch: context.connection.versionMatch,
      activeStudioId: context.connection.activeStudioId,
      place: compactPlace(context.connection.place),
    } : null,
    playContext: context.playContext || null,
    player: context.player || null,
    character: context.character ? {
      position: context.character.position,
      health: context.character.health,
      state: context.character.state,
    } : null,
    camera: context.camera || null,
    ui: context.ui ? {
      screenCount: context.ui.screenCount,
      visibleObjects: context.ui.visibleObjects,
      buttons: context.ui.buttons,
      textObjects: context.ui.textObjects,
      topText: context.ui.topText,
    } : null,
    latestOutputIssue: context.latestOutputIssue || null,
    commandFlow: context.commandFlow ? {
      queued: context.commandFlow.queued,
      manualFallbackPending: context.commandFlow.manualFallbackPending,
      recentCount: context.commandFlow.recentCount,
      slowCommandCount: Array.isArray(context.commandFlow.slowCommands) ? context.commandFlow.slowCommands.length : 0,
    } : null,
    readiness: context.readiness || null,
    freshness: context.freshness ? {
      source: context.freshness.source,
      fresh: context.freshness.fresh,
      ageMs: context.freshness.ageMs,
      staleReason: context.freshness.staleReason,
      fallbackSource: context.freshness.fallbackSource,
    } : null,
    summary: context.summary,
    nextAction: context.nextAction,
  };
}

function compactWatch(watch) {
  if (!watch || typeof watch !== 'object') return watch || null;
  return {
    ok: watch.ok,
    version: watch.version,
    mode: watch.mode,
    fresh: watch.fresh,
    status: watch.status ? {
      latestAgeMs: watch.status.latestAgeMs,
      activeContextType: watch.status.activeContextType,
      activeSource: watch.status.activeSource,
      fresh: watch.status.fresh,
      bufferSize: watch.status.bufferSize,
      recent10s: watch.status.recent10s,
      dropped: watch.status.dropped,
      trimmed: watch.status.trimmed,
    } : null,
    current: watch.current ? {
      at: watch.current.at,
      contextType: watch.current.contextType,
      source: watch.current.source,
      player: watch.current.player,
      character: watch.current.character ? {
        position: watch.current.character.position,
        health: watch.current.character.health,
        state: watch.current.character.state,
      } : null,
      camera: watch.current.camera,
      ui: watch.current.ui ? {
        screenCount: watch.current.ui.screenCount,
        visibleObjects: watch.current.ui.visibleObjects,
        buttons: watch.current.ui.buttons,
        textObjects: watch.current.ui.textObjects,
        topText: watch.current.ui.topText,
      } : null,
    } : null,
    recentMomentCount: Array.isArray(watch.recentMoments) ? watch.recentMoments.length : 0,
    latestOutputIssue: watch.latestOutputIssue || null,
    loop: watch.loop ? {
      coverage: watch.loop.coverage,
      nextMissing: watch.loop.nextMissing,
    } : null,
    summary: watch.summary,
    nextCommand: watch.nextCommand,
  };
}

function appendLog(event) {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(path.join(LOG_DIR, 'mcp-proxy.log'), `${JSON.stringify({ at: nowIso(), version: VERSION, ...redacted(event) })}\n`, 'utf8');
  } catch {
    // Logging is best-effort and must never affect tool calls.
  }
}

function httpJson(method, endpoint, body, timeoutMs = DEFAULT_READ_TIMEOUT_MS) {
  const url = new URL(endpoint, BASE_URL);
  const payload = body === undefined ? null : Buffer.from(JSON.stringify(body), 'utf8');
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: `${url.pathname}${url.search}`,
      method,
      timeout: timeoutMs,
      headers: payload ? {
        'Content-Type': 'application/json',
        'Content-Length': payload.length,
      } : {},
    }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let parsed = {};
        try {
          parsed = text ? JSON.parse(text) : {};
        } catch {
          parsed = { raw: text };
        }
        if (res.statusCode < 200 || res.statusCode >= 300) {
          const error = new Error((parsed && parsed.error && (parsed.error.message || parsed.error)) || `HTTP ${res.statusCode}`);
          error.statusCode = res.statusCode;
          error.body = parsed;
          reject(error);
          return;
        }
        resolve(parsed);
      });
    });
    req.on('timeout', () => req.destroy(new Error(`Timed out after ${timeoutMs}ms`)));
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function bridgeHealth(timeoutMs = 900) {
  try {
    return { ok: true, body: await httpJson('GET', '/health', undefined, timeoutMs) };
  } catch (error) {
    return { ok: false, error: error.message, code: 'bridgeOffline' };
  }
}

function spawnDetached(scriptPath, args = []) {
  try {
    if (!fs.existsSync(scriptPath)) return { ok: false, error: `Missing script: ${scriptPath}` };
    const child = childProcess.spawn(process.execPath, [scriptPath, ...args], {
      cwd: ROOT,
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    });
    child.unref();
    return { ok: true, pid: child.pid };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function ensureBridge() {
  const first = await bridgeHealth(900);
  if (first.ok) return { ok: true, started: false, health: first.body };

  const supervisor = spawnDetached(SUPERVISOR_SCRIPT, ['run']);
  for (let i = 0; i < 10; i += 1) {
    await sleep(300);
    const check = await bridgeHealth(900);
    if (check.ok) return { ok: true, started: true, via: 'supervisor', supervisor, health: check.body };
  }

  const server = spawnDetached(SERVER_SCRIPT, []);
  for (let i = 0; i < 10; i += 1) {
    await sleep(300);
    const check = await bridgeHealth(900);
    if (check.ok) return { ok: true, started: true, via: 'server', supervisor, server, health: check.body };
  }

  return {
    ok: false,
    code: 'bridgeOffline',
    error: 'StudioBridge HTTP server did not respond after bounded auto-start attempts.',
    firstError: first.error,
    supervisor,
    server,
    recovery: [
      'Run .\\tools\\bridge.cmd always-on status',
      'Run .\\tools\\bridge.cmd always-on start',
      'Run .\\tools\\bridge.cmd pair code',
    ],
  };
}

async function requestBridge(method, endpoint, body, timeoutMs) {
  const ready = await ensureBridge();
  if (!ready.ok) return { ok: false, ...ready };
  try {
    return await httpJson(method, endpoint, body, timeoutMs);
  } catch (error) {
    return {
      ok: false,
      code: error.statusCode === 409 ? 'activePlaceStale' : (error.statusCode === 404 ? 'studioNotPaired' : 'bridgeRequestFailed'),
      error: error.message,
      statusCode: error.statusCode || null,
      details: error.body || null,
      bridge: redacted(ready.health || null),
    };
  }
}

async function waitForCommand(id, timeoutMs = DEFAULT_COMMAND_TIMEOUT_MS) {
  const startedAt = Date.now();
  let last = null;
  while (Date.now() - startedAt < timeoutMs) {
    const snapshot = await requestBridge('GET', '/codex/commands?full=1', undefined, 3500);
    if (!snapshot || snapshot.ok === false) return snapshot;
    const command = Array.isArray(snapshot.commands) ? snapshot.commands.find((item) => item.id === id) : null;
    if (command) {
      last = command;
      if (TERMINAL_STATUSES.has(command.status)) return command;
    }
    await sleep(250);
  }
  return {
    ok: false,
    code: 'commandTimedOut',
    id,
    lastStatus: last ? last.status : null,
    command: redacted(last),
    recovery: 'Run .\\tools\\bridge.cmd commands --full to inspect the command, then .\\tools\\bridge.cmd places to verify the target place is fresh.',
  };
}

async function queueStudioCommand(type, payload = {}, options = {}) {
  const body = {
    id: options.id || crypto.randomUUID(),
    type,
    payload,
  };
  if (options.requiresApproval !== undefined) body.requiresApproval = options.requiresApproval;
  if (options.targetStudioId) body.targetStudioId = options.targetStudioId;
  if (options.targetPlaceId) body.targetPlaceId = options.targetPlaceId;
  if (options.targetPlaceName) body.targetPlaceName = options.targetPlaceName;

  const queued = await requestBridge('POST', '/codex/commands', body, 3500);
  if (!queued || queued.ok === false) return queued;
  const command = queued.commands && queued.commands[0];
  if (!command || !command.id) return { ok: false, code: 'commandQueueFailed', response: queued };
  const result = await waitForCommand(command.id, options.timeoutMs || DEFAULT_COMMAND_TIMEOUT_MS);
  if (!result || result.ok === false) return result;
  if (result.status === 'executed') return { ok: true, command: redacted(result), result: result.result };
  return { ok: false, code: result.status || 'commandFailed', command: redacted(result), error: result.error || null };
}

async function readCommand(type, payload = {}, options = {}) {
  return queueStudioCommand(type, payload, { ...options, requiresApproval: false, timeoutMs: options.timeoutMs || DEFAULT_COMMAND_TIMEOUT_MS });
}

async function mutationCommand(type, payload = {}, options = {}) {
  return queueStudioCommand(type, payload, { ...options, requiresApproval: true, timeoutMs: options.timeoutMs || DEFAULT_COMMAND_TIMEOUT_MS });
}

function basePayload(args = {}) {
  const payload = { helperVersion: args.helperVersion || VERSION };
  const expectedVersion = args.expectedVersion || args.pluginVersion || args.bridgeVersion;
  if (expectedVersion) payload.expectedVersion = expectedVersion;
  return payload;
}

function selectorPayload(args = {}) {
  const payload = {};
  for (const key of ['id', 'path', 'name', 'text', 'target', 'targetId']) {
    if (args[key] !== undefined && args[key] !== null && String(args[key]).trim() !== '') payload[key] = args[key];
  }
  return payload;
}

function outputQuery(args = {}) {
  const mode = String(args.mode || (args.history || args.full ? 'history' : 'current'));
  const limit = Math.max(1, Math.min(Number(args.limit || args.maxResults || 50), 500));
  const includeNoise = args.includeNoise || args.all ? '&includeNoise=1' : '';
  return `/codex/output/v2?mode=${encodeURIComponent(mode)}&limit=${encodeURIComponent(limit)}${includeNoise}`;
}

async function freshReadCommand(type, payload = {}, meta = {}) {
  const result = await readCommand(type, payload);
  return {
    ok: result && result.ok !== false,
    version: VERSION,
    at: nowIso(),
    freshness: {
      source: 'StudioBridge proxy read command',
      bounded: true,
      historyIncluded: false,
      maxResults: payload.maxResults || payload.maxNodes || payload.limit || null,
    },
    contract: meta,
    result,
  };
}

async function listRobloxStudios(args) {
  const places = await requestBridge('GET', '/codex/places', undefined, 2500);
  const mcp = await requestBridge('GET', '/codex/mcp-transport', undefined, 2500);
  if (places && places.ok === false) return places;
  return {
    ok: true,
    source: 'StudioBridge MCP proxy',
    places: compactPlaces(places),
    rawStudioMcp: mcp && mcp.ok !== false ? compactTransport(mcp).studioMcp : compactTransport(mcp),
    targetHint: args && args.place ? `Use place_use or pass place=${args.place}` : 'Use place_use to switch active place when several places are connected.',
  };
}

async function getStudioState() {
  const [health, context, watch, mcp] = await Promise.all([
    requestBridge('GET', '/health', undefined, 2500),
    requestBridge('GET', '/codex/context', undefined, 2500),
    requestBridge('GET', '/codex/watch', undefined, 2500),
    requestBridge('GET', '/codex/mcp-transport', undefined, 2500),
  ]);
  return { ok: true, health: compactHealth(health), context: compactContext(context), watch: compactWatch(watch), mcpTransport: compactTransport(mcp) };
}

const toolHandlers = {
  bridge_health: async () => compactHealth(await requestBridge('GET', '/health', undefined, 2500)),
  pairing_status: async () => requestBridge('GET', '/pairing', undefined, 2500),
  list_roblox_studios: listRobloxStudios,
  get_studio_state: getStudioState,
  get_console_output: async (args) => requestBridge('GET', outputQuery(args), undefined, 2500),
  get_output_errors: async (args) => requestBridge('GET', outputQuery({ ...args, mode: 'errors' }), undefined, 2500),
  mark_output_baseline: async () => requestBridge('POST', '/codex/output-baseline', { action: 'mark' }, 2500),
  place_use: async (args) => requestBridge('POST', '/codex/place/use', { selector: args.selector || args.place || args.name || args.placeId || args.studioId }, 3500),
  codex_context: async () => compactContext(await requestBridge('GET', '/codex/context', undefined, 2500)),
  watch_now: async () => compactWatch(await requestBridge('GET', '/codex/watch', undefined, 2500)),
  test_snapshot: async (args) => readCommand('getTestSnapshot', { ...basePayload(args), ...args }),
  test_move: async (args) => mutationCommand('moveTestCharacter', { ...basePayload(args), x: Number(args.x || 0), y: Number(args.y || 0), z: Number(args.z || 0), vector: args.vector }),
  test_teleport: async (args) => mutationCommand('teleportTestCharacter', { ...basePayload(args), x: Number(args.x || 0), y: Number(args.y || 0), z: Number(args.z || 0), vector: args.vector }),
  test_jump: async (args) => mutationCommand('jumpTestCharacter', { ...basePayload(args), ...args }),
  get_tree: async (args) => freshReadCommand('getTree', { path: args.path || args.root || 'Workspace', depth: Number(args.depth || 3), maxNodes: Number(args.maxNodes || args.limit || 500) }, { defaultMode: 'boundedFreshTree' }),
  search_game_tree: async (args) => freshReadCommand('searchInstances', { query: args.query || args.text || '', maxResults: Number(args.maxResults || args.limit || 100) }, { defaultMode: 'boundedInstanceSearch' }),
  script_search: async (args) => freshReadCommand(args.source ? 'searchSource' : 'searchScripts', { query: args.query || args.text || args.source || '', contextLines: Number(args.contextLines || 2), maxResults: Number(args.maxResults || args.limit || 100) }, { defaultMode: 'boundedScriptSearch' }),
  script_read: async (args) => freshReadCommand('readScriptSource', { path: args.path || args.script || args.query, instanceId: args.instanceId || args.id }, { defaultMode: 'explicitScriptRead', fullSource: Boolean(args.full || args.source) }),
  screen_capture: async (args) => readCommand('getVisualCaptureReport', { ...basePayload(args), ...args }),
  start_stop_play: async (args) => {
    const action = String(args.action || args.mode || 'status').toLowerCase();
    if (action === 'status') return readCommand('getStudioPlayControlStatus', { ...basePayload(args), ...args });
    if (action === 'start' || action === 'play' || action === 'run') return mutationCommand('requestStartPlay', { ...basePayload(args), mode: action, ...args });
    if (action === 'stop' || action === 'end') return mutationCommand('requestStopPlay', { ...basePayload(args), ...args });
    if (action === 'restart') return mutationCommand('requestRestartPlay', { ...basePayload(args), ...args });
    return { ok: false, code: 'invalidPlayAction', error: 'Use action=start, stop, restart, or status.' };
  },
  user_mouse_input: async (args) => mutationCommand('applyUiClickAction', { ...basePayload(args), ...selectorPayload(args), source: 'mcpProxyMouseInput' }),
  user_keyboard_input: async (args) => ({
    ok: false,
    code: 'manualRequired',
    reason: 'Generic keyboard injection is not exposed through the safe StudioBridge proxy.',
    alternatives: ['Use action_ui_list then user_mouse_input for UI targets.', 'Use test_move/test_jump/test_teleport for player actions.'],
    requested: redacted(args),
  }),
  action_ui_list: async (args) => readCommand('getUiActionTargets', { ...basePayload(args), ...selectorPayload(args), limit: Number(args.limit || 200) }),
  action_prompt_list: async (args) => readCommand('getPromptActionTargets', { ...basePayload(args), ...selectorPayload(args), limit: Number(args.limit || 200) }),
  animation_rigs: async (args) => readCommand('getAnimationRigInventory', { ...basePayload(args), path: args.path || args.root || 'Workspace' }),
  create_animation: async (args) => mutationCommand('saveGeneratedAnimation', { ...basePayload(args), rigPath: args.rigPath, animation: args.animation || args.spec, animationPath: args.animationPath, path: args.path }),
  preview_animation: async (args) => mutationCommand('previewAnimation', { ...basePayload(args), rigPath: args.rigPath, animationPath: args.animationPath || args.path, animation: args.animation || args.spec }),
  scrub_animation: async (args) => mutationCommand('scrubAnimationPreview', { ...basePayload(args), rigPath: args.rigPath, animationPath: args.animationPath || args.path, path: args.animationPath || args.path, time: Number(args.time || args.seconds || 0) }),
  vfx_inventory: async (args) => readCommand('getVfxInventory', { ...basePayload(args), path: args.path || args.root || 'Workspace' }),
  generate_vfx: async (args) => mutationCommand('generateVfxFromIntent', { ...basePayload(args), intent: args.intent || args.text || '', targetPath: args.targetPath, assetRoot: args.assetRoot }),
  generate_pro_vfx: async (args) => mutationCommand('generateProVfxFromIntent', { ...basePayload(args), intent: args.intent || args.text || '', targetPath: args.targetPath, assetRoot: args.assetRoot }),
  motion_vfx_generate: async (args) => mutationCommand('generateMotionVfxPackage', { ...basePayload(args), intent: args.intent || args.text || '', rigPath: args.rigPath, targetPath: args.targetPath, assetRoot: args.assetRoot }),
  ability_generate: async (args) => mutationCommand('generateAbilityFromIntent', { ...basePayload(args), intent: args.intent || args.text || '', rigPath: args.rigPath, targetPath: args.targetPath }),
  dashboard_status: async () => requestBridge('GET', '/dashboard/state', undefined, 2500),
  dashboard_state: async () => requestBridge('GET', '/dashboard/state', undefined, 2500),
  dashboard_url: async () => ({ ok: true, version: VERSION, url: Dashboard.DASHBOARD_URL, localOnly: true }),
  dashboard_open: async () => ({ ok: true, version: VERSION, url: Dashboard.DASHBOARD_URL, localOnly: true, nextCommand: 'tools\\bridge.cmd dashboard open' }),
  dashboard_self_check: async () => Dashboard.selfCheck(),
  dashboard_chat: async (args) => requestBridge('POST', '/dashboard/chat', { message: args.message || args.text || args.goal || '' }, 30000),
  dashboard_history: async () => requestBridge('GET', '/dashboard/chat/history', undefined, 2500),
  dashboard_clear_chat: async () => requestBridge('POST', '/dashboard/chat/clear', {}, 2500),
  dashboard_timeline: async () => requestBridge('GET', '/dashboard/timeline', undefined, 2500),
  dashboard_runs: async () => requestBridge('GET', '/dashboard/runs', undefined, 2500),
  dashboard_run: async (args) => requestBridge('GET', `/dashboard/run/${encodeURIComponent(args.runId || args.id || '')}`, undefined, 2500),
  dashboard_approvals: async () => requestBridge('GET', '/dashboard/approvals', undefined, 2500),
  dashboard_approve: async (args) => requestBridge('POST', `/dashboard/approvals/${encodeURIComponent(args.approvalId || args.id || '')}/approve`, {}, 45000),
  dashboard_reject: async (args) => requestBridge('POST', `/dashboard/approvals/${encodeURIComponent(args.approvalId || args.id || '')}/reject`, { reason: args.reason || 'mcpDashboardReject' }, 2500),
  dashboard_cost: async () => requestBridge('GET', '/dashboard/cost', undefined, 2500),
  dashboard_pipeline: async (args) => requestBridge('POST', '/dashboard/pipeline', { goal: args.goal || args.intent || args.message || '', preset: args.preset, planOnly: args.planOnly === true }, 60000),
  dashboard_presets: async () => requestBridge('GET', '/dashboard/pipeline/presets', undefined, 2500),
  dashboard_safety: async () => requestBridge('GET', '/dashboard/safety', undefined, 2500),
  execute_status: async () => requestBridge('GET', '/codex/execution/status', undefined, 2500),
  execute_roots: async () => requestBridge('GET', '/codex/execution/roots', undefined, 2500),
  execute_preview: async (args) => requestBridge('GET', `/codex/execution/preview?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium Roblox production build')}`, undefined, 3500),
  execute_apply: async (args) => requestBridge('POST', '/codex/execution/apply', { goal: args.goal || args.intent || args.text || 'premium Roblox production build' }, DEFAULT_COMMAND_TIMEOUT_MS),
  execute_worldgen: async (args) => requestBridge('GET', `/codex/execution/worldgen?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium Roblox world build')}`, undefined, 3500),
  execute_assetkit: async (args) => requestBridge('GET', `/codex/execution/assetkit?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium Roblox asset kit')}`, undefined, 3500),
  execute_cinematic: async (args) => requestBridge('GET', `/codex/execution/cinematic?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium Roblox cinematic moment')}`, undefined, 3500),
  execute_qa_markers: async (args) => requestBridge('GET', `/codex/execution/qa-markers?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium Roblox QA markers')}`, undefined, 3500),
  execute_polish: async (args) => requestBridge('GET', `/codex/execution/polish?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium Roblox polish pass')}`, undefined, 3500),
  execute_safe_fix: async (args) => requestBridge('GET', `/codex/execution/safe-fix?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium Roblox safe fix')}`, undefined, 3500),
  execute_verify: async (args) => requestBridge('GET', `/codex/execution/verify?transactionId=${encodeURIComponent(args.transactionId || args.id || args.goal || args.intent || args.text || '')}`, undefined, 3500),
  execute_transactions: async (args) => requestBridge('GET', `/codex/execution/transactions?limit=${encodeURIComponent(args.limit || 50)}`, undefined, 3500),
  execute_receipt: async (args) => requestBridge('GET', `/codex/execution/receipt?transactionId=${encodeURIComponent(args.transactionId || args.id || '')}`, undefined, 3500),
  execute_rollback: async (args) => requestBridge('POST', '/codex/execution/rollback', { transactionId: args.transactionId || args.id }, DEFAULT_COMMAND_TIMEOUT_MS),
  execute_manifest: async (args) => requestBridge('GET', `/codex/execution/manifest?transactionId=${encodeURIComponent(args.transactionId || args.id || args.goal || args.intent || args.text || '')}`, undefined, 3500),
  ai_status: async () => AiOrchestrator.getStatus(),
  ai_config: async () => AiOrchestrator.getConfig(),
  ai_models: async () => AiOrchestrator.getModelCatalog(),
  ai_tools: async () => AiOrchestrator.getToolCatalog(),
  ai_plan: async (args) => AiOrchestrator.getProductionPlan(args.goal || args.intent || args.text || 'premium Roblox production goal', { source: 'mcpProxy' }),
  ai_run: async (args) => AiOrchestrator.runProduction(args.goal || args.intent || args.text || 'premium Roblox production goal', { ...args, source: 'mcpProxy' }),
  ai_continue: async (args) => AiOrchestrator.continueRun(args.runId || args.id || ''),
  ai_approve: async (args) => AiOrchestrator.approveRun(args.runId || args.id || ''),
  ai_cancel: async (args) => AiOrchestrator.cancelRun(args.runId || args.id || ''),
  ai_reference: async (args) => ReferenceLab.analyzeReference(args.source || args.path || args.url || args.goal || args.intent || args.text || '', { source: 'mcpProxy.aiReference', metadata: redacted(args.metadata || {}) }),
  ai_reference_image: async (args) => ReferenceLab.analyzeImageFile(args.source || args.path || args.url || args.goal || args.intent || args.text || '', { source: 'mcpProxy.aiReferenceImage', metadata: redacted(args.metadata || {}) }),
  ai_cost: async () => AiOrchestrator.getCostReport(),
  ai_runs: async (args) => AiOrchestrator.listRuns(Number(args.limit || 50)),
  ai_report: async (args) => AiOrchestrator.getRunReport(args.runId || args.id || ''),
  reference_status: async () => ReferenceLab.getStatus(),
  reference_intake: async (args) => ReferenceLab.getIntakeReport(args.source || args.path || args.url || args.goal || args.intent || args.text || '', { source: 'mcpProxy.reference.intake', metadata: redacted(args.metadata || {}) }),
  reference_image: async (args) => ReferenceLab.analyzeImageFile(args.source || args.path || args.url || args.goal || args.intent || args.text || '', { source: 'mcpProxy.reference.image', metadata: redacted(args.metadata || {}) }),
  reference_analyze_image: async (args) => ReferenceLab.analyzeImageFile(args.source || args.path || args.url || args.goal || args.intent || args.text || '', { source: 'mcpProxy.reference.analyzeImage', metadata: redacted(args.metadata || {}) }),
  reference_analyze: async (args) => ReferenceLab.analyzeReference(args.source || args.path || args.url || args.goal || args.intent || args.text || '', { source: 'mcpProxy.reference.analyze', metadata: redacted(args.metadata || {}) }),
  reference_style: async (args) => ReferenceLab.getStyleProfile(args.source || args.path || args.url || args.goal || args.intent || args.text || ''),
  reference_scene: async (args) => ReferenceLab.getSceneUnderstanding(args.source || args.path || args.url || args.goal || args.intent || args.text || ''),
  reference_materials: async (args) => ReferenceLab.getMaterialLanguage(args.source || args.path || args.url || args.goal || args.intent || args.text || ''),
  reference_objects: async (args) => ReferenceLab.getObjectCandidates(args.source || args.path || args.url || args.goal || args.intent || args.text || ''),
  reference_layout: async (args) => ReferenceLab.getLayoutHypotheses(args.source || args.path || args.url || args.goal || args.intent || args.text || ''),
  reference_gameplay: async (args) => ReferenceLab.getGameplayInterpretation(args.source || args.path || args.url || args.goal || args.intent || args.text || ''),
  reference_missing: async (args) => ReferenceLab.getMissingViewReport(args.source || args.path || args.url || args.goal || args.intent || args.text || ''),
  reference_compare: async (args) => ReferenceLab.compareReferences(args.refA || args.a || args.sourceA || args.before || '', args.refB || args.b || args.sourceB || args.after || ''),
  reference_manifest: async (args) => ReferenceLab.getManifest(args.source || args.path || args.url || args.goal || args.intent || args.text || ''),
  reference_remember: async (args) => ReferenceLab.remember(args.source || args.path || args.url || args.goal || args.intent || args.text || '', { source: 'mcpProxy.reference.remember', metadata: redacted(args.metadata || {}) }),
  reconstruct_status: async () => Reconstruction.getStatus(),
  reconstruct_infer: async (args) => Reconstruction.createInferenceReport(args.source || args.path || args.url || args.goal || args.intent || args.text || '', { source: 'mcpProxy.reconstruct.infer', metadata: redacted(args.metadata || {}) }),
  reconstruct_structure: async (args) => Reconstruction.getStructuralReconstructionPlan(args.source || args.path || args.url || args.goal || args.intent || args.text || ''),
  reconstruct_interior: async (args) => Reconstruction.getInteriorInferencePlan(args.source || args.path || args.url || args.goal || args.intent || args.text || ''),
  reconstruct_exterior: async (args) => Reconstruction.getExteriorCompletionPlan(args.source || args.path || args.url || args.goal || args.intent || args.text || ''),
  reconstruct_backside: async (args) => Reconstruction.getBacksideInferencePlan(args.source || args.path || args.url || args.goal || args.intent || args.text || ''),
  reconstruct_floorplan: async (args) => Reconstruction.getFloorplanInferencePlan(args.source || args.path || args.url || args.goal || args.intent || args.text || ''),
  reconstruct_rooms: async (args) => Reconstruction.getRoomGraphPlan(args.source || args.path || args.url || args.goal || args.intent || args.text || ''),
  reconstruct_routes: async (args) => Reconstruction.getRouteInferencePlan(args.source || args.path || args.url || args.goal || args.intent || args.text || ''),
  reconstruct_gameplay: async (args) => Reconstruction.getGameplaySpacePlan(args.source || args.path || args.url || args.goal || args.intent || args.text || ''),
  reconstruct_collisions: async (args) => Reconstruction.getCollisionInferencePlan(args.source || args.path || args.url || args.goal || args.intent || args.text || ''),
  reconstruct_variants: async (args) => Reconstruction.getReconstructionVariants(args.source || args.path || args.url || args.goal || args.intent || args.text || ''),
  reconstruct_worldgen: async (args) => Reconstruction.getWorldgenReconstructionBridge(args.source || args.path || args.url || args.goal || args.intent || args.text || ''),
  reconstruct_assetforge: async (args) => Reconstruction.getAssetForgeReconstructionBridge(args.source || args.path || args.url || args.goal || args.intent || args.text || ''),
  reconstruct_execute_plan: async (args) => Reconstruction.getExecutionReconstructionPlan(args.source || args.path || args.url || args.goal || args.intent || args.text || ''),
  reconstruct_manifest: async (args) => Reconstruction.getReconstructionManifest(args.source || args.path || args.url || args.goal || args.intent || args.text || ''),
  reconstruct_remember: async (args) => Reconstruction.remember(args.source || args.path || args.url || args.goal || args.intent || args.text || '', { source: 'mcpProxy.reconstruct.remember', metadata: redacted(args.metadata || {}) }),
  worldcompile_status: async () => WorldCompiler.getStatus(),
  worldcompile_intake: async (args) => WorldCompiler.getWorldCompilerIntakeReport(args.source || args.path || args.url || args.goal || args.intent || args.text || '', { source: 'mcpProxy.worldcompile.intake', metadata: redacted(args.metadata || {}) }),
  worldcompile_image: async (args) => WorldCompiler.getWorldCompilerImageReport(args.source || args.path || args.url || args.goal || args.intent || args.text || '', { source: 'mcpProxy.worldcompile.image', metadata: redacted(args.metadata || {}) }),
  image_to_world: async (args) => WorldCompiler.getWorldCompilerImageReport(args.source || args.path || args.url || args.goal || args.intent || args.text || '', { source: 'mcpProxy.imageToWorld', metadata: redacted(args.metadata || {}) }),
  worldcompile_plan: async (args) => WorldCompiler.getWorldCompilerPlan(args.source || args.path || args.url || args.goal || args.intent || args.text || '', { source: 'mcpProxy.worldcompile.plan', metadata: redacted(args.metadata || {}) }),
  worldcompile_compile: async (args) => WorldCompiler.getWorldCompilerCompileReport(args.source || args.path || args.url || args.goal || args.intent || args.text || '', { source: 'mcpProxy.worldcompile.compile', metadata: redacted(args.metadata || {}) }),
  worldcompile_package: async (args) => WorldCompiler.getWorldCompilerPackage(args.source || args.path || args.url || args.goal || args.intent || args.text || '', { source: 'mcpProxy.worldcompile.package', metadata: redacted(args.metadata || {}) }),
  worldcompile_worldgen: async (args) => WorldCompiler.getWorldCompilerWorldgenBridge(args.source || args.path || args.url || args.goal || args.intent || args.text || '', { source: 'mcpProxy.worldcompile.worldgen', metadata: redacted(args.metadata || {}) }),
  worldcompile_assetkit: async (args) => WorldCompiler.getWorldCompilerAssetKitBridge(args.source || args.path || args.url || args.goal || args.intent || args.text || '', { source: 'mcpProxy.worldcompile.assetkit', metadata: redacted(args.metadata || {}) }),
  worldcompile_cinematic: async (args) => WorldCompiler.getWorldCompilerCinematicBridge(args.source || args.path || args.url || args.goal || args.intent || args.text || '', { source: 'mcpProxy.worldcompile.cinematic', metadata: redacted(args.metadata || {}) }),
  worldcompile_qa: async (args) => WorldCompiler.getWorldCompilerQaBridge(args.source || args.path || args.url || args.goal || args.intent || args.text || '', { source: 'mcpProxy.worldcompile.qa', metadata: redacted(args.metadata || {}) }),
  worldcompile_execute_preview: async (args) => WorldCompiler.getWorldCompilerExecutionPreview(args.source || args.path || args.url || args.goal || args.intent || args.text || '', { source: 'mcpProxy.worldcompile.executePreview', metadata: redacted(args.metadata || {}) }),
  worldcompile_score: async (args) => WorldCompiler.getWorldCompilerScore(args.source || args.path || args.url || args.goal || args.intent || args.text || '', { source: 'mcpProxy.worldcompile.score', metadata: redacted(args.metadata || {}) }),
  worldcompile_remember: async (args) => WorldCompiler.rememberWorldCompiler(args.source || args.path || args.url || args.goal || args.intent || args.text || '', { source: 'mcpProxy.worldcompile.remember', metadata: redacted(args.metadata || {}) }),
  worldcompile_manifest: async (args) => WorldCompiler.getWorldCompilerManifest(args.source || args.path || args.url || args.goal || args.intent || args.text || '', { source: 'mcpProxy.worldcompile.manifest', metadata: redacted(args.metadata || {}) }),
  fidelity_status: async () => Fidelity.getStatus(),
  fidelity_compare: async (args) => Fidelity.compare(args.source || args.path || args.url || args.goal || args.intent || args.text || '', { source: 'mcpProxy.fidelity.compare', metadata: redacted(args.metadata || {}) }),
  fidelity_reference: async (args) => Fidelity.reference(args.source || args.path || args.url || args.goal || args.intent || args.text || '', { source: 'mcpProxy.fidelity.reference', metadata: redacted(args.metadata || {}) }),
  fidelity_studio: async (args) => Fidelity.studio(args.source || args.path || args.url || args.goal || args.intent || args.text || '', { source: 'mcpProxy.fidelity.studio', metadata: redacted(args.metadata || {}) }),
  fidelity_score: async (args) => Fidelity.score(args.source || args.path || args.url || args.goal || args.intent || args.text || '', { source: 'mcpProxy.fidelity.score', metadata: redacted(args.metadata || {}) }),
  fidelity_gaps: async (args) => Fidelity.gaps(args.source || args.path || args.url || args.goal || args.intent || args.text || '', { source: 'mcpProxy.fidelity.gaps', metadata: redacted(args.metadata || {}) }),
  fidelity_fix_plan: async (args) => Fidelity.fixPlan(args.source || args.path || args.url || args.goal || args.intent || args.text || '', { source: 'mcpProxy.fidelity.fixPlan', metadata: redacted(args.metadata || {}) }),
  fidelity_memory: async (args) => Fidelity.memory(args.source || args.path || args.url || args.goal || args.intent || args.text || '', { source: 'mcpProxy.fidelity.memory', metadata: redacted(args.metadata || {}) }),
  fidelity_manifest: async (args) => Fidelity.manifest(args.source || args.path || args.url || args.goal || args.intent || args.text || '', { source: 'mcpProxy.fidelity.manifest', metadata: redacted(args.metadata || {}) }),
  memory_status: async () => Memory.getProductionMemoryStatus(),
  memory_profile: async () => Memory.getProjectMemoryProfile(),
  memory_learn: async (args) => Memory.learnFromProductionReport(args.goal || args.intent || args.text || args.report || 'premium Roblox production goal', args),
  memory_remember: async (args) => Memory.rememberProductionNote(args.note || args.text || args.goal || '', args),
  memory_recall: async (args) => Memory.getProductionMemoryRecall(args.query || args.goal || args.intent || args.text || ''),
  memory_style: async (args) => Memory.getProductionStyleMemory(args.goal || args.intent || args.text || 'premium Roblox production goal'),
  memory_references: async (args) => Memory.getReferenceStyleProfiles(args.goal || args.intent || args.text || 'premium Roblox production goal'),
  memory_lessons: async (args) => Memory.getBuildLessons(args.goal || args.intent || args.text || 'premium Roblox production goal'),
  memory_scores: async (args) => Memory.getScoreHistory(args.goal || args.intent || args.text || 'premium Roblox production goal'),
  memory_issues: async (args) => Memory.getIssuePatterns(args.goal || args.intent || args.text || 'premium Roblox production goal'),
  memory_recommend: async (args) => Memory.getMemoryRecommendations(args.goal || args.intent || args.text || 'premium Roblox production goal'),
  memory_apply: async (args) => Memory.getMemoryApplyPlan(args.goal || args.intent || args.text || 'premium Roblox production goal'),
  memory_export: async () => Memory.exportProductionMemory(),
  audio_inventory: async (args) => readCommand('getAudioInventory', { ...basePayload(args), path: args.path || args.root || 'SoundService' }),
  audio_audit: async (args) => readCommand('getAudioQualityAudit', { ...basePayload(args), path: args.path || args.root || 'Workspace' }),
  audio_plan: async (args) => readCommand('getAudioMixPlan', { ...basePayload(args), intent: args.intent || args.text || args.profile || 'balanced', profile: args.profile }),
  audio_mix: async (args) => mutationCommand('applyAudioMixPlan', { ...basePayload(args), intent: args.intent || args.text || args.profile || 'balanced', profile: args.profile }),
  audio_live: async (args) => readCommand('getAudioLiveMonitorStatus', { ...basePayload(args), path: args.path || args.root }),
  sync_audio: async (args) => mutationCommand('syncAudioToPackage', { ...basePayload(args), path: args.path || args.packagePath || args.animationPath || args.vfxPath, packagePath: args.packagePath }),
  build_styles: async (args) => readCommand('getBuildStyleCatalog', { ...basePayload(args), ...args }),
  build_plan: async (args) => readCommand('getBuildIntentPlan', { ...basePayload(args), intent: args.intent || args.text || '' }),
  generate_model: async (args) => mutationCommand('generateModelFromIntent', { ...basePayload(args), intent: args.intent || args.text || '', targetPath: args.targetPath, assetRoot: args.assetRoot }),
  generate_scene: async (args) => mutationCommand('generateSceneFromIntent', { ...basePayload(args), intent: args.intent || args.text || '', targetPath: args.targetPath, assetRoot: args.assetRoot }),
  audit_build: async (args) => readCommand('getBuildQualityAudit', { ...basePayload(args), path: args.path || args.modelPath || args.targetPath, modelPath: args.modelPath || args.path }),
  polish_build: async (args) => mutationCommand('polishGeneratedBuild', { ...basePayload(args), path: args.path || args.modelPath || args.targetPath, modelPath: args.modelPath || args.path }),
  optimize_build: async (args) => mutationCommand('optimizeGeneratedBuild', { ...basePayload(args), path: args.path || args.modelPath || args.targetPath, modelPath: args.modelPath || args.path }),
  roblox_brain: async (args) => mutationCommand('executeRobloxBrainPlan', { ...basePayload(args), goal: args.goal || args.intent || args.text || '', intent: args.intent || args.goal || args.text || '', action: args.action || 'build' }),
  build_game: async (args) => mutationCommand('buildGameFromGoal', { ...basePayload(args), goal: args.goal || args.intent || args.text || '', intent: args.intent || args.goal || args.text || '', action: 'build' }),
  improve_game: async (args) => mutationCommand('improveGameFromGoal', { ...basePayload(args), goal: args.goal || args.intent || args.text || '', intent: args.intent || args.goal || args.text || '', action: 'improve' }),
  test_game: async (args) => mutationCommand('testGameFromGoal', { ...basePayload(args), goal: args.goal || args.intent || args.text || 'full game QA', intent: args.intent || args.goal || args.text || 'full game QA', action: 'test' }),
  polish_game: async (args) => mutationCommand('polishGameFromGoal', { ...basePayload(args), goal: args.goal || args.intent || args.text || 'premium game polish', intent: args.intent || args.goal || args.text || 'premium game polish', action: 'polish' }),
  creator_os: async (args) => mutationCommand('generateCreatorOsPackage', { ...basePayload(args), goal: args.goal || args.intent || args.text || '', intent: args.intent || args.goal || args.text || '', action: args.action || 'build' }),
  create_game: async (args) => mutationCommand('generateCreatorOsPackage', { ...basePayload(args), goal: args.goal || args.intent || args.text || '', intent: args.intent || args.goal || args.text || '', action: 'build' }),
  premium_director: async (args) => readCommand('getPremiumDirectorStatus', { ...basePayload(args), goal: args.goal || args.intent || args.text || '' }),
  premium_plan: async (args) => readCommand('getPremiumProductionBrief', { ...basePayload(args), goal: args.goal || args.intent || args.text || '', intent: args.intent || args.goal || args.text || '' }),
  premium_style: async (args) => readCommand('getPremiumStyleBible', { ...basePayload(args), goal: args.goal || args.intent || args.text || '', intent: args.intent || args.goal || args.text || '' }),
  premium_assets: async (args) => requestBridge('GET', `/codex/assetforge/plan?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium Roblox asset kit')}`, undefined, 2500),
  premium_world: async (args) => requestBridge('GET', `/codex/worldgen/plan?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium Roblox world')}`, undefined, 2500),
  premium_build: async (args) => mutationCommand('executePremiumBuildRound', { ...basePayload(args), goal: args.goal || args.intent || args.text || '', intent: args.intent || args.goal || args.text || '', manifest: args.manifest }),
  premium_critique: async (args) => readCommand('getPremiumVisualCritiquePlan', { ...basePayload(args), goal: args.goal || args.intent || args.text || '', intent: args.intent || args.goal || args.text || '' }),
  premium_qa: async (args) => readCommand('getPremiumQaPlan', { ...basePayload(args), goal: args.goal || args.intent || args.text || '', intent: args.intent || args.goal || args.text || '' }),
  premium_polish: async (args) => mutationCommand('polishPremiumBuildRound', { ...basePayload(args), goal: args.goal || args.intent || args.text || '', intent: args.intent || args.goal || args.text || '', manifest: args.manifest }),
  premium_score: async (args) => readCommand('getPremiumQualityScore', { ...basePayload(args), goal: args.goal || args.intent || args.text || '', intent: args.intent || args.goal || args.text || '', manifestPath: args.manifestPath || args.path }),
  visual_status: async () => requestBridge('GET', '/codex/visual/status', undefined, 2500),
  visual_evidence: async (args) => requestBridge('GET', `/codex/visual/evidence?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium Roblox scene')}`, undefined, 2500),
  visual_critique: async (args) => requestBridge('GET', `/codex/visual/critique?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium Roblox scene')}`, undefined, 2500),
  visual_score: async (args) => requestBridge('GET', `/codex/visual/score?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium Roblox scene')}`, undefined, 2500),
  visual_polish: async (args) => requestBridge('GET', `/codex/visual/polish?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium Roblox scene')}`, undefined, 2500),
  visual_compare: async (args) => requestBridge('POST', '/codex/visual/compare', { reportA: args.reportA || args.before, reportB: args.reportB || args.after, goal: args.goal || args.intent || args.text }, 2500),
  worldgen_status: async () => requestBridge('GET', '/codex/worldgen/status', undefined, 2500),
  worldgen_styles: async () => requestBridge('GET', '/codex/worldgen/styles', undefined, 2500),
  worldgen_plan: async (args) => requestBridge('GET', `/codex/worldgen/plan?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium Roblox world')}`, undefined, 2500),
  worldgen_graph: async (args) => requestBridge('GET', `/codex/worldgen/graph?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium Roblox world')}`, undefined, 2500),
  worldgen_generate: async (args) => requestBridge('GET', `/codex/worldgen/generate?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium Roblox world')}`, undefined, 2500),
  worldgen_audit: async (args) => requestBridge('GET', `/codex/worldgen/audit?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium Roblox world')}`, undefined, 2500),
  worldgen_polish: async (args) => requestBridge('GET', `/codex/worldgen/polish?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium Roblox world')}`, undefined, 2500),
  worldgen_route: async (args) => requestBridge('GET', `/codex/worldgen/route?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium Roblox world')}`, undefined, 2500),
  worldgen_budget: async (args) => requestBridge('GET', `/codex/worldgen/budget?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium Roblox world')}`, undefined, 2500),
  worldgen_manifest: async (args) => requestBridge('GET', `/codex/worldgen/manifest?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium Roblox world')}`, undefined, 2500),
  assetforge_status: async () => requestBridge('GET', '/codex/assetforge/status', undefined, 2500),
  assetforge_styles: async () => requestBridge('GET', '/codex/assetforge/styles', undefined, 2500),
  assetforge_plan: async (args) => requestBridge('GET', `/codex/assetforge/plan?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium Roblox asset kit')}`, undefined, 2500),
  assetforge_kit: async (args) => requestBridge('GET', `/codex/assetforge/kit?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium Roblox asset kit')}`, undefined, 2500),
  assetforge_mesh_plan: async (args) => requestBridge('GET', `/codex/assetforge/mesh-plan?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium Roblox asset kit')}`, undefined, 2500),
  assetforge_material_plan: async (args) => requestBridge('GET', `/codex/assetforge/material-plan?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium Roblox asset kit')}`, undefined, 2500),
  assetforge_generate: async (args) => requestBridge('GET', `/codex/assetforge/generate?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium Roblox asset kit')}`, undefined, 2500),
  assetforge_audit: async (args) => requestBridge('GET', `/codex/assetforge/audit?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium Roblox asset kit')}`, undefined, 2500),
  assetforge_polish: async (args) => requestBridge('GET', `/codex/assetforge/polish?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium Roblox asset kit')}`, undefined, 2500),
  assetforge_budget: async (args) => requestBridge('GET', `/codex/assetforge/budget?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium Roblox asset kit')}`, undefined, 2500),
  assetforge_library: async (args) => requestBridge('GET', `/codex/assetforge/library?rootPath=${encodeURIComponent(args.rootPath || args.path || 'Workspace')}`, undefined, 2500),
  assetforge_sockets: async (args) => requestBridge('GET', `/codex/assetforge/sockets?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium Roblox asset kit')}`, undefined, 2500),
  assetforge_manifest: async (args) => requestBridge('GET', `/codex/assetforge/manifest?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium Roblox asset kit')}`, undefined, 2500),
  cinematic_status: async () => requestBridge('GET', '/codex/cinematic/status', undefined, 2500),
  cinematic_styles: async () => requestBridge('GET', '/codex/cinematic/styles', undefined, 2500),
  cinematic_plan: async (args) => requestBridge('GET', `/codex/cinematic/plan?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'anime boss intro attack')}`, undefined, 2500),
  cinematic_timeline: async (args) => requestBridge('GET', `/codex/cinematic/timeline?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'anime boss intro attack')}`, undefined, 2500),
  cinematic_beats: async (args) => requestBridge('GET', `/codex/cinematic/beats?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'anime boss intro attack')}`, undefined, 2500),
  cinematic_camera: async (args) => requestBridge('GET', `/codex/cinematic/camera?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'anime boss intro attack')}`, undefined, 2500),
  cinematic_animation: async (args) => requestBridge('GET', `/codex/cinematic/animation?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'anime boss intro attack')}`, undefined, 2500),
  cinematic_vfx_sync: async (args) => requestBridge('GET', `/codex/cinematic/vfx-sync?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'anime boss intro attack')}`, undefined, 2500),
  cinematic_audio_sync: async (args) => requestBridge('GET', `/codex/cinematic/audio-sync?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'anime boss intro attack')}`, undefined, 2500),
  cinematic_gamefeel: async (args) => requestBridge('GET', `/codex/cinematic/gamefeel?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'anime boss intro attack')}`, undefined, 2500),
  cinematic_generate: async (args) => requestBridge('GET', `/codex/cinematic/generate?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'anime boss intro attack')}`, undefined, 2500),
  cinematic_preview: async (args) => requestBridge('GET', `/codex/cinematic/preview?goal=${encodeURIComponent(args.goal || args.intent || args.text || args.path || 'anime boss intro attack')}`, undefined, 2500),
  cinematic_audit: async (args) => requestBridge('GET', `/codex/cinematic/audit?goal=${encodeURIComponent(args.goal || args.intent || args.text || args.path || 'anime boss intro attack')}`, undefined, 2500),
  cinematic_polish: async (args) => requestBridge('GET', `/codex/cinematic/polish?goal=${encodeURIComponent(args.goal || args.intent || args.text || args.path || 'anime boss intro attack')}`, undefined, 2500),
  cinematic_manifest: async (args) => requestBridge('GET', `/codex/cinematic/manifest?goal=${encodeURIComponent(args.goal || args.intent || args.text || args.path || 'anime boss intro attack')}`, undefined, 2500),
  make_cinematic: async (args) => requestBridge('GET', `/codex/cinematic/generate?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'anime boss intro attack')}`, undefined, 2500),
  gamefeel: async (args) => requestBridge('GET', `/codex/cinematic/gamefeel?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'make combat feel good')}`, undefined, 2500),
  sync_moment: async (args) => requestBridge('GET', `/codex/cinematic/plan?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'sync animation vfx audio')}`, undefined, 2500),
  qa_status: async () => requestBridge('GET', '/codex/qa/status', undefined, 2500),
  qa_personas: async () => requestBridge('GET', '/codex/qa/personas', undefined, 2500),
  qa_plan: async (args) => requestBridge('GET', `/codex/qa/plan?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium anime dungeon hub launch QA')}`, undefined, 2500),
  qa_swarm: async (args) => requestBridge('GET', `/codex/qa/swarm?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium anime dungeon hub launch QA')}`, undefined, 2500),
  qa_run: async (args) => requestBridge('GET', `/codex/qa/run?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium anime dungeon hub launch QA')}`, undefined, 2500),
  qa_route: async (args) => requestBridge('GET', `/codex/qa/route?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium anime dungeon hub')}`, undefined, 2500),
  qa_ui: async (args) => requestBridge('GET', `/codex/qa/ui?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium anime dungeon hub')}`, undefined, 2500),
  qa_combat: async (args) => requestBridge('GET', `/codex/qa/combat?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium anime dungeon hub')}`, undefined, 2500),
  qa_economy: async (args) => requestBridge('GET', `/codex/qa/economy?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium anime dungeon hub')}`, undefined, 2500),
  qa_multiplayer: async (args) => requestBridge('GET', `/codex/qa/multiplayer?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium anime dungeon hub')}`, undefined, 2500),
  qa_performance: async (args) => requestBridge('GET', `/codex/qa/performance?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium anime dungeon hub')}`, undefined, 2500),
  qa_regression: async (args) => requestBridge('GET', `/codex/qa/regression?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium anime dungeon hub')}`, undefined, 2500),
  qa_accessibility: async (args) => requestBridge('GET', `/codex/qa/accessibility?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium anime dungeon hub')}`, undefined, 2500),
  qa_launch: async (args) => requestBridge('GET', `/codex/qa/launch?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium anime dungeon hub')}`, undefined, 2500),
  qa_report: async (args) => requestBridge('GET', `/codex/qa/report?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium anime dungeon hub')}`, undefined, 2500),
  qa_fix_plan: async (args) => requestBridge('GET', `/codex/qa/fix-plan?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium anime dungeon hub')}`, undefined, 2500),
  qa_manifest: async (args) => requestBridge('GET', `/codex/qa/manifest?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium anime dungeon hub')}`, undefined, 2500),
  autopilot_status: async () => requestBridge('GET', '/codex/autopilot/status', undefined, 2500),
  autopilot_plan: async (args) => requestBridge('GET', `/codex/autopilot/plan?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium anime dungeon hub')}`, undefined, 2500),
  autopilot_loop: async (args) => requestBridge('GET', `/codex/autopilot/loop?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium anime dungeon hub')}`, undefined, 2500),
  autopilot_run: async (args) => requestBridge('GET', `/codex/autopilot/run?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium anime dungeon hub')}`, undefined, 2500),
  autopilot_round: async (args) => requestBridge('GET', `/codex/autopilot/round?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium anime dungeon hub')}`, undefined, 2500),
  autopilot_evidence: async (args) => requestBridge('GET', `/codex/autopilot/evidence?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium anime dungeon hub')}`, undefined, 2500),
  autopilot_issues: async (args) => requestBridge('GET', `/codex/autopilot/issues?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium anime dungeon hub')}`, undefined, 2500),
  autopilot_fix_plan: async (args) => requestBridge('GET', `/codex/autopilot/fix-plan?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium anime dungeon hub')}`, undefined, 2500),
  autopilot_apply_safe: async (args) => requestBridge('GET', `/codex/autopilot/apply-safe?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium anime dungeon hub')}`, undefined, 2500),
  autopilot_polish: async (args) => requestBridge('GET', `/codex/autopilot/polish?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium anime dungeon hub')}`, undefined, 2500),
  autopilot_retest: async (args) => requestBridge('GET', `/codex/autopilot/retest?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium anime dungeon hub')}`, undefined, 2500),
  autopilot_score: async (args) => requestBridge('GET', `/codex/autopilot/score?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium anime dungeon hub')}`, undefined, 2500),
  autopilot_report: async (args) => requestBridge('GET', `/codex/autopilot/report?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium anime dungeon hub')}`, undefined, 2500),
  autopilot_manifest: async (args) => requestBridge('GET', `/codex/autopilot/manifest?goal=${encodeURIComponent(args.goal || args.intent || args.text || 'premium anime dungeon hub')}`, undefined, 2500),
  style_bible: async (args) => readCommand('getCreatorStyleBible', { ...basePayload(args), goal: args.goal || args.intent || args.text || '', intent: args.intent || args.goal || args.text || '' }),
  forge_assets: async (args) => readCommand('getCreatorAssetForgePlan', { ...basePayload(args), goal: args.goal || args.intent || args.text || '', intent: args.intent || args.goal || args.text || '', assetRoot: args.assetRoot }),
  execute_luau: async (args) => ({
    ok: false,
    code: 'unsupportedUnsafeRawExecution',
    reason: 'The durable StudioBridge MCP proxy does not provide hidden arbitrary Luau execution.',
    alternatives: ['script_search', 'script_read', 'search_game_tree', 'create_animation', 'generate_vfx', 'test_move', 'start_stop_play'],
    requested: redacted(args),
  }),
};

const toolDefinitions = [
  ['bridge_health', 'Return StudioBridge HTTP health and version.', {}],
  ['pairing_status', 'Return current pairing code/state for the StudioBridge plugin.', {}],
  ['list_roblox_studios', 'List StudioBridge paired/open places and raw StudioMCP health if available.', { place: { type: 'string' } }],
  ['get_studio_state', 'Return active Studio state, fast Codex context, watch summary, and transport diagnostics.', {}],
  ['get_console_output', 'Return fresh baseline-aware Output by default; use mode=history for old logs.', { mode: { type: 'string', enum: ['current', 'recent', 'history', 'errors', 'warnings', 'all'] }, limit: { type: 'number' }, includeNoise: { type: 'boolean' } }],
  ['get_output_errors', 'Return current grouped actionable Output errors/warnings since baseline.', { limit: { type: 'number' } }],
  ['mark_output_baseline', 'Mark the current Output baseline so future reads ignore old history.', {}],
  ['place_use', 'Switch the active StudioBridge place.', { selector: { type: 'string' } }],
  ['codex_context', 'Return fast live Codex context.', {}],
  ['watch_now', 'Return compact Smart Watch state.', {}],
  ['get_tree', 'Return a bounded fresh Roblox game tree report.', { path: { type: 'string' }, depth: { type: 'number' }, maxNodes: { type: 'number' } }],
  ['search_game_tree', 'Search Roblox game tree instances.', { query: { type: 'string' }, maxResults: { type: 'number' } }],
  ['script_search', 'Search scripts or source text.', { query: { type: 'string' }, source: { type: 'string' }, maxResults: { type: 'number' } }],
  ['script_read', 'Read script source by path or instance id.', { path: { type: 'string' }, instanceId: { type: 'string' } }],
  ['screen_capture', 'Return screenshot/capture status or structured visual fallback.', { path: { type: 'string' } }],
  ['start_stop_play', 'Start, stop, restart, or inspect Play mode. Defaults to manual-watch; pass allowStudioTestServiceApi=true only when debugging the risky Studio API path.', { action: { type: 'string', enum: ['status', 'start', 'stop', 'restart', 'run'] }, allowStudioTestServiceApi: { type: 'boolean' } }],
  ['user_mouse_input', 'Attempt a safe UI click action by id/path/name/text through StudioBridge.', { id: { type: 'string' }, path: { type: 'string' }, text: { type: 'string' }, name: { type: 'string' } }],
  ['user_keyboard_input', 'Report safe keyboard-input alternatives.', { text: { type: 'string' } }],
  ['action_ui_list', 'List actionable visible UI targets.', { text: { type: 'string' }, name: { type: 'string' }, id: { type: 'string' } }],
  ['action_prompt_list', 'List ProximityPrompt/interactable targets.', { text: { type: 'string' }, name: { type: 'string' }, id: { type: 'string' } }],
  ['test_snapshot', 'Return universal test pilot snapshot.', {}],
  ['test_move', 'Move the test character by vector/components.', { x: { type: 'number' }, y: { type: 'number' }, z: { type: 'number' } }],
  ['test_teleport', 'Teleport the test character to a position.', { x: { type: 'number' }, y: { type: 'number' }, z: { type: 'number' } }],
  ['test_jump', 'Make the test character jump.', {}],
  ['animation_rigs', 'List animation-capable rigs.', { path: { type: 'string' } }],
  ['create_animation', 'Create/save a generated animation from a provided spec under generated paths.', { rigPath: { type: 'string' }, animation: { type: 'object' }, spec: { type: 'object' } }],
  ['preview_animation', 'Preview an animation on a rig.', { rigPath: { type: 'string' }, animationPath: { type: 'string' } }],
  ['scrub_animation', 'Scrub/apply an animation pose at time.', { rigPath: { type: 'string' }, animationPath: { type: 'string' }, time: { type: 'number' } }],
  ['vfx_inventory', 'Inspect VFX objects under a path.', { path: { type: 'string' } }],
  ['generate_vfx', 'Generate a Codex-owned VFX preset from intent.', { intent: { type: 'string' }, targetPath: { type: 'string' }, assetRoot: { type: 'string' } }],
  ['generate_pro_vfx', 'Generate a pro VFX preset from intent and available asset kits.', { intent: { type: 'string' }, targetPath: { type: 'string' }, assetRoot: { type: 'string' } }],
  ['motion_vfx_generate', 'Generate a synchronized motion/VFX package.', { intent: { type: 'string' }, rigPath: { type: 'string' }, targetPath: { type: 'string' } }],
  ['ability_generate', 'Generate a Codex-owned ability package.', { intent: { type: 'string' }, rigPath: { type: 'string' }, targetPath: { type: 'string' } }],
  ['dashboard_status', 'Return V84 local dashboard bridge/Studio/API/safety status without exposing secrets.', {}],
  ['dashboard_state', 'Return the V84 local production dashboard state: active place, chat, timeline, approvals, runs, scores, transactions, warnings, and next command.', {}],
  ['dashboard_url', 'Return the local-only dashboard URL.', {}],
  ['dashboard_open', 'Return dashboard open guidance and URL. Use tools\\bridge.cmd dashboard open to launch the browser.', {}],
  ['dashboard_chat', 'Send a message to V84 dashboard AI chat through the local bridge. Does not mutate Studio.', { message: { type: 'string' }, text: { type: 'string' }, goal: { type: 'string' } }],
  ['dashboard_history', 'Return V84 dashboard chat history.', {}],
  ['dashboard_clear_chat', 'Clear V84 dashboard chat history.', {}],
  ['dashboard_timeline', 'Return V84 dashboard tool timeline.', {}],
  ['dashboard_runs', 'Return V84 dashboard run history.', {}],
  ['dashboard_run', 'Return one V84 dashboard run by id.', { runId: { type: 'string' }, id: { type: 'string' } }],
  ['dashboard_approvals', 'Return V84 dashboard approval queue.', {}],
  ['dashboard_approve', 'Approve one V84 dashboard approval item. Applies only through V72 execution.', { approvalId: { type: 'string' }, id: { type: 'string' } }],
  ['dashboard_reject', 'Reject one V84 dashboard approval item.', { approvalId: { type: 'string' }, id: { type: 'string' }, reason: { type: 'string' } }],
  ['dashboard_cost', 'Return V84 dashboard cost/API configuration summary without secrets.', {}],
  ['dashboard_pipeline', 'Run a V84 dashboard one-click workflow preview. Stops at approval before apply.', { goal: { type: 'string' }, intent: { type: 'string' }, message: { type: 'string' }, preset: { type: 'string' }, planOnly: { type: 'boolean' } }],
  ['dashboard_presets', 'List V84 dashboard one-click workflow presets.', {}],
  ['dashboard_safety', 'Return V84 dashboard safety and local-only policy report.', {}],
  ['dashboard_self_check', 'Run V84 dashboard chat/timeline/security/router self-checks.', {}],
  ['execute_status', 'Return V72 Production Execution Kernel readiness, roots, capabilities, and safety policy.', {}],
  ['execute_roots', 'Return V72 Codex-owned execution roots and rollback-safe path policy.', {}],
  ['execute_preview', 'Preview a V72 transaction-backed real Studio build plan without mutating Studio.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['execute_apply', 'Apply a V72 transaction-backed Codex-owned build plan through StudioBridge Full Trust when safe.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['execute_worldgen', 'Compile a V66 worldgen graph into V72 Codex-owned Studio build actions.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['execute_assetkit', 'Compile a V67 asset kit plan into V72 Codex-owned placeholder/socket/manifest actions.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['execute_cinematic', 'Compile a V68 cinematic moment into V72 beat/camera/VFX/audio marker actions.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['execute_qa_markers', 'Compile V69 QA swarm probes into V72 route/UI/performance marker actions.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['execute_polish', 'Compile premium/autopilot polish guidance into V72 Codex-owned marker/manifests.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['execute_safe_fix', 'Compile evidence-linked safe fixes into V72 Codex-owned manifests without touching production scripts.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['execute_verify', 'Verify a V72 transaction receipt or return preview verification guidance for a goal.', { transactionId: { type: 'string' }, id: { type: 'string' }, goal: { type: 'string' } }],
  ['execute_transactions', 'List recent V72 execution transactions.', { limit: { type: 'number' } }],
  ['execute_receipt', 'Return the V72 receipt for a transaction.', { transactionId: { type: 'string' }, id: { type: 'string' } }],
  ['execute_rollback', 'Rollback a V72 transaction using receipt-scoped Codex-owned targets only.', { transactionId: { type: 'string' }, id: { type: 'string' } }],
  ['execute_manifest', 'Return a V72 execution manifest for a transaction or preview a goal manifest.', { transactionId: { type: 'string' }, id: { type: 'string' }, goal: { type: 'string' } }],
  ['ai_status', 'Return V73 API Orchestrator readiness without exposing secrets.', {}],
  ['ai_config', 'Return V73 local API configuration policy and redacted key presence.', {}],
  ['ai_models', 'List supported/recommended API planning models.', {}],
  ['ai_tools', 'List StudioBridge specialist tools available to the API orchestrator.', {}],
  ['ai_plan', 'Create an API-backed or offline local production plan; no Studio mutation.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' }, model: { type: 'string' } }],
  ['ai_run', 'Create a V73 bounded AI production run state; mutations still route through V72 gates.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' }, model: { type: 'string' } }],
  ['ai_continue', 'Continue a stored V73 run to the next approval/checkpoint state.', { runId: { type: 'string' }, id: { type: 'string' } }],
  ['ai_approve', 'Approve the next local V73 run step; external/account risks still remain blocked/manual.', { runId: { type: 'string' }, id: { type: 'string' } }],
  ['ai_cancel', 'Cancel a stored V73 run.', { runId: { type: 'string' }, id: { type: 'string' } }],
  ['ai_reference', 'Analyze a reference through V74 Reference Lab; no fake image or pixel claims.', { source: { type: 'string' }, path: { type: 'string' }, url: { type: 'string' }, goal: { type: 'string' } }],
  ['ai_reference_image', 'Run explicit V78 local image-file analysis through the API orchestrator when configured, otherwise metadata-only.', { source: { type: 'string' }, path: { type: 'string' }, goal: { type: 'string' } }],
  ['ai_cost', 'Return local estimated run cost summary.', {}],
  ['ai_runs', 'List recent V73 AI production runs.', { limit: { type: 'number' } }],
  ['ai_report', 'Return a stored V73 AI run report.', { runId: { type: 'string' }, id: { type: 'string' } }],
  ['reference_status', 'Return V74 Reference Lab readiness, privacy, no-fake-analysis policy, and next command.', {}],
  ['reference_intake', 'Classify a note/path/folder/image reference without storing raw image bytes.', { source: { type: 'string' }, path: { type: 'string' }, url: { type: 'string' }, goal: { type: 'string' } }],
  ['reference_image', 'Analyze a local image file explicitly; uses real API vision only when configured and available.', { source: { type: 'string' }, path: { type: 'string' }, goal: { type: 'string' } }],
  ['reference_analyze_image', 'Alias for V78 explicit local image-file analysis with honest metadata/API vision status.', { source: { type: 'string' }, path: { type: 'string' }, goal: { type: 'string' } }],
  ['reference_analyze', 'Turn a reference note/path into style, scene, material, object, layout, gameplay, missing-view, and production hints.', { source: { type: 'string' }, path: { type: 'string' }, url: { type: 'string' }, goal: { type: 'string' }, text: { type: 'string' } }],
  ['reference_style', 'Extract a Roblox-ready reference style profile.', { source: { type: 'string' }, goal: { type: 'string' }, text: { type: 'string' } }],
  ['reference_scene', 'Infer reference scene structure, scale, focal points, props, and gameplay use cases.', { source: { type: 'string' }, goal: { type: 'string' }, text: { type: 'string' } }],
  ['reference_materials', 'Extract material language, Roblox material fallbacks, and manual SurfaceAppearance specs.', { source: { type: 'string' }, goal: { type: 'string' }, text: { type: 'string' } }],
  ['reference_objects', 'Return object candidates with build strategy, Asset Forge hints, and Worldgen hints.', { source: { type: 'string' }, goal: { type: 'string' }, text: { type: 'string' } }],
  ['reference_layout', 'Return faithful, gameplay-first, and mobile-optimized layout hypotheses.', { source: { type: 'string' }, goal: { type: 'string' }, text: { type: 'string' } }],
  ['reference_gameplay', 'Infer spawn, objective, traversal, interactions, loops, cinematic moments, and QA risks.', { source: { type: 'string' }, goal: { type: 'string' }, text: { type: 'string' } }],
  ['reference_missing', 'Return missing-view questions and safe inferences for partial references.', { source: { type: 'string' }, goal: { type: 'string' }, text: { type: 'string' } }],
  ['reference_compare', 'Compare two reference notes/paths and return shared/different production language.', { refA: { type: 'string' }, refB: { type: 'string' }, a: { type: 'string' }, b: { type: 'string' } }],
  ['reference_manifest', 'Save/return a redacted V74 reference manifest for specialist planning.', { source: { type: 'string' }, goal: { type: 'string' }, text: { type: 'string' } }],
  ['reference_remember', 'Store a redacted V74 reference profile in Production Memory.', { source: { type: 'string' }, goal: { type: 'string' }, text: { type: 'string' } }],
  ['reconstruct_status', 'Return V75 Structural Reconstruction readiness, capabilities, confidence policy, and next command.', {}],
  ['reconstruct_infer', 'Infer missing views, interiors, floorplans, routes, gameplay spaces, collision zones, and production bridges with confidence.', { source: { type: 'string' }, path: { type: 'string' }, url: { type: 'string' }, goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['reconstruct_structure', 'Return the V75 structural shell/opening/playable-space plan.', { source: { type: 'string' }, goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['reconstruct_interior', 'Infer interior rooms, purposes, vertical links, and inaccessible spaces from exterior/reference evidence.', { source: { type: 'string' }, goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['reconstruct_exterior', 'Complete visible/unseen exterior shell, side walls, roof, and openings without claiming certainty.', { source: { type: 'string' }, goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['reconstruct_backside', 'Infer back side alternatives with confidence, reasons, and user-reference needs.', { source: { type: 'string' }, goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['reconstruct_floorplan', 'Return inferred levels, rooms, connections, blockers, spawn candidates, and objective candidates.', { source: { type: 'string' }, goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['reconstruct_rooms', 'Return the V75 room graph with roles, adjacency, asset needs, lighting needs, VFX needs, and QA risks.', { source: { type: 'string' }, goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['reconstruct_routes', 'Return spawn/objective/shop/quest/portal/reward/full-loop/secret/mobile-safe route plans.', { source: { type: 'string' }, goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['reconstruct_gameplay', 'Infer spawn, objective, loop, shop, quest, portal, combat, social, reward, cinematic, and mobile readability spaces.', { source: { type: 'string' }, goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['reconstruct_collisions', 'Infer walls, railings, blocked decor, no-collision VFX, collision proxies, and path clearances.', { source: { type: 'string' }, goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['reconstruct_variants', 'Return faithfulReference, gameplayFirst, and mobileOptimized reconstruction variants.', { source: { type: 'string' }, goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['reconstruct_worldgen', 'Convert V75 reconstruction into V66-compatible zones, paths, landmarks, vistas, blockers, sockets, and QA routes.', { source: { type: 'string' }, goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['reconstruct_assetforge', 'Convert V75 reconstruction into V67-compatible asset families, materials, sockets, collision proxies, doors/windows, trims, and props.', { source: { type: 'string' }, goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['reconstruct_execute_plan', 'Return a V72 preview-only execution plan for Codex-owned reconstruction markers/blockouts; does not mutate Studio.', { source: { type: 'string' }, goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['reconstruct_manifest', 'Save/return a redacted V75 reconstruction manifest for later worldgen/assetforge/execution planning.', { source: { type: 'string' }, goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['reconstruct_remember', 'Store a redacted V75 reconstruction profile in Production Memory; no raw image bytes.', { source: { type: 'string' }, goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['worldcompile_status', 'Return V76 Image / Reference-to-Playable World Compiler readiness, safety policy, and next command.', {}],
  ['worldcompile_intake', 'Classify a reference note/path/folder/image for playable-world compile without storing raw image bytes.', { source: { type: 'string' }, path: { type: 'string' }, url: { type: 'string' }, goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['worldcompile_image', 'Compile an explicit local image file into a playable-world package and V72 execution preview without applying.', { source: { type: 'string' }, path: { type: 'string' }, goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['image_to_world', 'Alias for V78 explicit local image-file to worldcompile package flow.', { source: { type: 'string' }, path: { type: 'string' }, goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['worldcompile_plan', 'Plan the V76 pipeline from reference to playable Roblox world package; no Studio mutation.', { source: { type: 'string' }, path: { type: 'string' }, url: { type: 'string' }, goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['worldcompile_compile', 'Compile a reference/concept into reference, reconstruction, worldgen, asset kit, cinematic, QA, and V72 preview reports.', { source: { type: 'string' }, path: { type: 'string' }, url: { type: 'string' }, goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['worldcompile_package', 'Return/save the full V76 playable-world package manifest; still plan/preview only.', { source: { type: 'string' }, path: { type: 'string' }, url: { type: 'string' }, goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['worldcompile_worldgen', 'Return the V66-compatible worldgen graph bridge from a V76 package.', { source: { type: 'string' }, goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['worldcompile_assetkit', 'Return the V67-compatible Asset Forge kit bridge from a V76 package.', { source: { type: 'string' }, goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['worldcompile_cinematic', 'Return the V68-compatible cinematic bridge from a V76 package.', { source: { type: 'string' }, goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['worldcompile_qa', 'Return the V69-compatible QA launch plan from a V76 package.', { source: { type: 'string' }, goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['worldcompile_execute_preview', 'Return the V72 execution preview bridge for a V76 package; does not apply Studio changes.', { source: { type: 'string' }, goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['worldcompile_score', 'Score V76 reference fidelity, structure, playability, assets, cinematic, QA, and execution readiness.', { source: { type: 'string' }, goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['worldcompile_remember', 'Store a redacted V76 playable-world package summary in Production Memory.', { source: { type: 'string' }, goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['worldcompile_manifest', 'Save/return a redacted V76 playable-world package manifest.', { source: { type: 'string' }, goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['fidelity_status', 'Return V80 Reference Fidelity readiness, capabilities, safety policy, and next command.', {}],
  ['fidelity_compare', 'Compare reference/profile/image evidence against Studio evidence without faking pixels or mutating Studio.', { source: { type: 'string' }, path: { type: 'string' }, goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['fidelity_reference', 'Return the reference side of a V80 comparison, using image vision only when honestly available.', { source: { type: 'string' }, path: { type: 'string' }, goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['fidelity_studio', 'Return the Studio evidence side of a V80 comparison using visual/worldcompile structured evidence.', { source: { type: 'string' }, path: { type: 'string' }, goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['fidelity_score', 'Return V80 fidelity scores for style, shape, material, lighting, focal hierarchy, objects, layout, gameplay, and mobile adaptation.', { source: { type: 'string' }, path: { type: 'string' }, goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['fidelity_gaps', 'Return reference-vs-Studio mismatches and intentional gameplay adaptations.', { source: { type: 'string' }, path: { type: 'string' }, goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['fidelity_fix_plan', 'Create a V72-compatible safe fix plan for reference fidelity gaps; does not apply changes.', { source: { type: 'string' }, path: { type: 'string' }, goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['fidelity_memory', 'Store a redacted reference fidelity lesson in Production Memory; no raw image bytes.', { source: { type: 'string' }, path: { type: 'string' }, goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['fidelity_manifest', 'Save/return a redacted V80 fidelity comparison manifest.', { source: { type: 'string' }, path: { type: 'string' }, goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['memory_status', 'Return V71 Production Memory readiness, local storage, and redaction policy.', {}],
  ['memory_profile', 'Return the local project memory profile and user taste profile.', {}],
  ['memory_learn', 'Learn redacted production memory from a goal or report summary.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' }, report: { type: 'object' } }],
  ['memory_remember', 'Remember a redacted production note in local memory.', { note: { type: 'string' }, text: { type: 'string' }, goal: { type: 'string' } }],
  ['memory_recall', 'Recall matching production memory items.', { query: { type: 'string' }, goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['memory_style', 'Return style memory and user taste for a goal.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['memory_references', 'Return learned reference style profiles for a goal.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['memory_lessons', 'Return learned build, QA, and production-loop lessons.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['memory_scores', 'Return remembered score history for a goal.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['memory_issues', 'Return remembered issue patterns and next fix commands.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['memory_recommend', 'Return recommendations from local Production Memory.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['memory_apply', 'Return an advisory memory apply plan; does not mutate Roblox content.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['memory_export', 'Export redacted Production Memory to a local JSON pack.', {}],
  ['audio_inventory', 'Inspect Roblox Sound/SoundGroup/audio objects and classify their roles.', { path: { type: 'string' }, root: { type: 'string' } }],
  ['audio_audit', 'Audit game audio for loudness, grouping, spam, rolloff, and sync risks.', { path: { type: 'string' }, root: { type: 'string' } }],
  ['audio_plan', 'Create a safe audio mix plan for a profile or plain-language intent.', { intent: { type: 'string' }, profile: { type: 'string' } }],
  ['audio_mix', 'Apply a backed-up SoundGroup/volume mix plan through Full Trust audit.', { intent: { type: 'string' }, profile: { type: 'string' } }],
  ['audio_live', 'Report Play-mode active sound loudness bands and audio monitor status.', { path: { type: 'string' }, root: { type: 'string' } }],
  ['sync_audio', 'Add audio cue manifest metadata to a generated animation/VFX/ability package.', { path: { type: 'string' }, packagePath: { type: 'string' }, animationPath: { type: 'string' }, vfxPath: { type: 'string' } }],
  ['build_styles', 'List StudioBridge build/model/scene archetypes, detail layers, and style rules.', {}],
  ['build_plan', 'Plan a clean Roblox model/scene from intent with scale, parts, sockets, material palette, and performance budget.', { intent: { type: 'string' }, text: { type: 'string' } }],
  ['generate_model', 'Generate a Codex-owned versioned Roblox model from intent using safe primitive construction.', { intent: { type: 'string' }, text: { type: 'string' }, targetPath: { type: 'string' }, assetRoot: { type: 'string' } }],
  ['generate_scene', 'Generate a Codex-owned versioned scene/lobby/arena/map composition from intent.', { intent: { type: 'string' }, text: { type: 'string' }, targetPath: { type: 'string' }, assetRoot: { type: 'string' } }],
  ['audit_build', 'Audit a generated or selected model for scale, anchors, collision, detail density, materials, and performance risk.', { path: { type: 'string' }, modelPath: { type: 'string' } }],
  ['polish_build', 'Apply a Codex-owned detail/polish pass to a generated model or scene.', { path: { type: 'string' }, modelPath: { type: 'string' } }],
  ['optimize_build', 'Apply/write optimization guidance and safe generated-detail tuning for a model or scene.', { path: { type: 'string' }, modelPath: { type: 'string' } }],
  ['roblox_brain', 'Route a whole-game goal through the unified Roblox Brain Core and execute clear Full Trust local actions.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' }, action: { type: 'string' } }],
  ['build_game', 'Use the Roblox Brain to build a coordinated Codex-owned game feature/scene/system from a goal.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['improve_game', 'Use the Roblox Brain to improve an existing game slice with specialist tools and audit notes.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['test_game', 'Use the Roblox Brain to route universal Play/Test/watch/output QA for a goal.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['polish_game', 'Use the Roblox Brain to polish generated gameplay, visuals, audio, motion, and performance.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['creator_os', 'Generate a V62 Creator OS package: style bible, asset forge, production blueprint, and specialist route.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' }, assetRoot: { type: 'string' } }],
  ['create_game', 'Use Creator OS to create a coordinated premium Roblox game slice from intent.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['premium_director', 'Return V63 Premium Director status, workflow, and quality rubric.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['premium_plan', 'Create a V63 premium production brief and full director manifest plan.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['premium_style', 'Return a V63 premium style bible for a Roblox build/game intent.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['premium_assets', 'Return the V67 Asset Forge Pro plan used by Premium Director for reusable premium asset kits.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' }, assetRoot: { type: 'string' } }],
  ['premium_world', 'Return the V66 Premium PCG Worldgen plan used by Premium Director for map, lobby, arena, dungeon, and hub goals.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['premium_build', 'Execute a V63 Codex-owned premium build round and bake a director manifest.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' }, manifest: { type: 'object' } }],
  ['premium_critique', 'Return a V63 visual critique plan for premium feel, silhouette, lighting, materials, VFX, and mobile readability.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['premium_qa', 'Return a V63 QA plan for premium build/game slices.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['premium_polish', 'Run a V63 quality-score-driven premium polish round.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' }, manifest: { type: 'object' } }],
  ['premium_score', 'Score a V63 premium manifest or goal across production-quality dimensions.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' }, manifestPath: { type: 'string' }, path: { type: 'string' } }],
  ['visual_status', 'Return V65 Visual Critic readiness and screenshot evidence limitations.', {}],
  ['visual_evidence', 'Return a V65 structured visual evidence pack and shot plan.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['visual_critique', 'Return a V65 evidence-backed visual critique with scores, problems, and polish actions.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['visual_score', 'Return the V65 weighted visual quality score and sub-scores.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['visual_polish', 'Return the V65 nine-stage visual polish plan.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['visual_compare', 'Compare two V65 visual critique reports.', { reportA: { type: 'object' }, reportB: { type: 'object' }, before: { type: 'object' }, after: { type: 'object' }, goal: { type: 'string' } }],
  ['worldgen_status', 'Return V66 Premium PCG World Generator readiness and integrations.', {}],
  ['worldgen_styles', 'List V66 world layout style catalog entries.', {}],
  ['worldgen_plan', 'Turn map/world intent into V66 required zones, routes, sockets, and budgets.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['worldgen_graph', 'Return a V66 layout graph with zones, paths, landmarks, vistas, sockets, and QA routes.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['worldgen_generate', 'Return or execute a V66 Codex-owned worldgen generation plan.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['worldgen_audit', 'Audit a V66 worldgen layout for flow, readability, performance, and premium feel.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['worldgen_polish', 'Return the V66 eleven-stage world layout polish plan.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['worldgen_route', 'Return V66 traversal QA routes for map flow testing.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['worldgen_budget', 'Return V66 mobile/performance budgets for the worldgen graph.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['worldgen_manifest', 'Return a V66 worldgen manifest shape.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['assetforge_status', 'Return V67 Asset Forge Pro readiness and integrations.', {}],
  ['assetforge_styles', 'List V67 premium asset style catalog entries.', {}],
  ['assetforge_plan', 'Plan premium reusable asset families, taxonomy, manifests, and specialist integration.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['assetforge_kit', 'Return a V67 reusable asset kit plan with all required sections and reuse rules.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['assetforge_mesh_plan', 'Return honest manualRequired mesh specs plus primitive fallback plans without fake asset IDs.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['assetforge_material_plan', 'Return MaterialVariant, SurfaceAppearance, decal, and fallback material specs.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['assetforge_generate', 'Return or execute a V67 Codex-owned asset kit generation plan.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['assetforge_audit', 'Audit V67 asset kit quality, sockets, LOD, material readiness, and premium feel.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['assetforge_polish', 'Return the V67 eleven-stage asset kit polish plan.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['assetforge_budget', 'Return V67 LOD, collision, mobile fallback, and performance budgets.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['assetforge_library', 'Scan or report a bounded asset library root for reuse and risk classification.', { rootPath: { type: 'string' }, path: { type: 'string' } }],
  ['assetforge_sockets', 'Return V67 VFX/audio/prompt/camera/UI/animation/collision/lighting socket plan.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['assetforge_manifest', 'Return a V67 Asset Forge manifest shape.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['cinematic_status', 'Return V68 Cinematic Motion Director readiness and integrations.', {}],
  ['cinematic_styles', 'List V68 cinematic/game-feel style catalog entries.', {}],
  ['cinematic_plan', 'Plan a premium motion/game-feel moment with specialist routes.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['cinematic_timeline', 'Return beats, markers, VFX/audio/camera/UI events, gameplay windows, and motion budget.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['cinematic_beats', 'Return the cinematic beat sheet with anticipation, impact, follow-through, recovery, and readability beats.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['cinematic_camera', 'Return camera framing, FOV, shake, impact push, release, and mobile fallback plan.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['cinematic_animation', 'Return animation marker/pose/timing plan with manualRequired upload behavior.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['cinematic_vfx_sync', 'Map cinematic markers to charge/trail/flash/burst/debris/smoke/aura/cleanup VFX cues.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['cinematic_audio_sync', 'Map cinematic markers to audio cue specs without fake asset IDs.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['cinematic_gamefeel', 'Return anticipation, input buffer, hit-stop, UI punch, recovery, and accessibility game-feel plan.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['cinematic_generate', 'Return or execute a V68 Codex-owned cinematic package generation plan.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['cinematic_preview', 'Return safe cinematic preview strategy or manualRequired fallback.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' }, path: { type: 'string' } }],
  ['cinematic_audit', 'Audit cinematic timing, sync, camera, hit-stop, mobile safety, and premium game-feel.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' }, path: { type: 'string' } }],
  ['cinematic_polish', 'Return the V68 twelve-stage cinematic polish plan.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' }, path: { type: 'string' } }],
  ['cinematic_manifest', 'Return a V68 cinematic manifest shape.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' }, path: { type: 'string' } }],
  ['make_cinematic', 'Direct alias for V68 cinematic generation.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['gamefeel', 'Direct alias for V68 game-feel plan.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['sync_moment', 'Direct alias for V68 marker sync planning.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['qa_status', 'Return V69 Autonomous QA Swarm readiness and integrations.', {}],
  ['qa_personas', 'List V69 QA personas for onboarding, mobile, performance, route, UI, prompt, combat, economy, multiplayer, accessibility, and premium checks.', {}],
  ['qa_plan', 'Plan QA scope, personas, scenarios, evidence, integrations, and risk areas.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['qa_swarm', 'Return coordinated QA agents, scenario missions, schedule, pass/fail criteria, and evidence targets.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['qa_run', 'Return/run a bounded QA swarm plan through StudioBridge when available; otherwise manualRequired.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['qa_route', 'Plan worldgen route walker probes for spawn/shop/quest/portal/training/full-loop paths.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['qa_ui', 'Plan UI/action probes for CTAs, shop, quest, close buttons, mobile safe zone, truncation, and spam safety.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['qa_combat', 'Plan combat/game-feel QA using V68 cinematic timing, VFX/audio sync, hit feedback, cooldown, and output checks.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['qa_economy', 'Return read-only/manualRequired economy/reward-loop audit plan; no DataStore/purchase/monetization mutation.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['qa_multiplayer', 'Return bounded local multiplayer QA plan or manualRequired when local players are unavailable.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['qa_performance', 'Return observational performance probe plan without fake profiler readings.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['qa_regression', 'Return output-baseline and manifest-aware regression plan.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['qa_accessibility', 'Return readability, contrast, motion comfort, safe-zone, and color/audio-only accessibility checks.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['qa_launch', 'Return V69 launch readiness score with all required subscores.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['qa_report', 'Return QA issue/evidence report.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['qa_fix_plan', 'Return staged QA fix plan from blockers through final premium pass.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['qa_manifest', 'Return V69 QA Swarm manifest shape.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['autopilot_status', 'Return V70 Closed-Loop Production Autopilot readiness and integrations.', {}],
  ['autopilot_plan', 'Create a V70 production plan with policy, specialists, acceptance gates, and safety budget.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['autopilot_loop', 'Return the full bounded V70 loop plan from preflight through final report.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['autopilot_run', 'Return/run a bounded V70 autopilot production loop when Studio evidence is available.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['autopilot_round', 'Return a V70 round plan with rollback and mutation budget.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['autopilot_evidence', 'Collect the V70 unified evidence-pack contract without faking unavailable evidence.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['autopilot_issues', 'Normalize visual, QA, worldgen, assetforge, cinematic, output, premium, and plugin issues.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['autopilot_fix_plan', 'Return evidence-linked V70 safe fix stages with manualRequired escalations.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['autopilot_apply_safe', 'Apply or plan only Codex-owned V70 safe fixes within the current safety budget.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['autopilot_polish', 'Return V70 polish plan across visuals, assets, world, cinematic, QA, output, and score.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['autopilot_retest', 'Return V70 retest plan routed through QA Swarm and visual/premium score checks.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['autopilot_score', 'Aggregate V70 launch/premium readiness into a 0-100 score and rating.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['autopilot_report', 'Return the V70 final report shape with score history, remaining issues, and next commands.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['autopilot_manifest', 'Return the V70 manifest path and Codex-owned storage contract.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['style_bible', 'Return a V62 style bible for a Roblox game/build intent.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' } }],
  ['forge_assets', 'Return a V62 asset forge plan for meshes, textures, materials, audio, animations, and reusable kits.', { goal: { type: 'string' }, intent: { type: 'string' }, text: { type: 'string' }, assetRoot: { type: 'string' } }],
  ['execute_luau', 'Return safe StudioBridge alternatives for arbitrary Luau execution.', { code: { type: 'string' } }],
].map(([name, description, properties]) => ({
  name,
  description,
  inputSchema: {
    type: 'object',
    properties,
    additionalProperties: true,
  },
}));

function toolsList() {
  return toolDefinitions;
}

async function callTool(name, args = {}) {
  const handler = toolHandlers[name];
  if (!handler) {
    return {
      ok: false,
      code: 'unknownTool',
      error: `Unknown StudioBridge MCP proxy tool: ${name}`,
      availableTools: Object.keys(toolHandlers).sort(),
    };
  }
  appendLog({ type: 'toolCall', name, args });
  try {
    const result = await handler(args && typeof args === 'object' ? args : {});
    appendLog({ type: 'toolResult', name, ok: result && result.ok !== false, status: result && result.status, code: result && result.code });
    return result;
  } catch (error) {
    const result = { ok: false, code: 'toolFailed', error: error.message, stack: error.stack };
    appendLog({ type: 'toolFailed', name, error: error.message });
    return result;
  }
}

function mcpResultFromValue(value) {
  const isError = value && value.ok === false;
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(value, null, 2),
      },
    ],
    isError: Boolean(isError),
  };
}

function sendJsonRpc(id, result, error) {
  const message = error
    ? { jsonrpc: '2.0', id, error }
    : { jsonrpc: '2.0', id, result };
  const body = Buffer.from(JSON.stringify(message), 'utf8');
  process.stdout.write(`Content-Length: ${body.length}\r\n\r\n`);
  process.stdout.write(body);
}

async function handleRpc(message) {
  if (!message || typeof message !== 'object') return;
  const id = message.id;
  const method = message.method;
  try {
    if (method === 'initialize') {
      sendJsonRpc(id, {
        protocolVersion: message.params && message.params.protocolVersion ? message.params.protocolVersion : '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'codex-studiobridge-mcp-proxy', version: VERSION },
      });
      return;
    }
    if (method === 'notifications/initialized' || method === 'initialized') return;
    if (method === 'tools/list') {
      sendJsonRpc(id, { tools: toolsList() });
      return;
    }
    if (method === 'tools/call') {
      const params = message.params || {};
      const value = await callTool(params.name, params.arguments || {});
      sendJsonRpc(id, mcpResultFromValue(value));
      return;
    }
    if (id !== undefined && id !== null) {
      sendJsonRpc(id, null, { code: -32601, message: `Unsupported method: ${method}` });
    }
  } catch (error) {
    if (id !== undefined && id !== null) sendJsonRpc(id, null, { code: -32603, message: error.message });
  }
}

function runStdioServer() {
  let buffer = Buffer.alloc(0);
  process.stdin.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    for (;;) {
      const headerEnd = buffer.indexOf('\r\n\r\n');
      if (headerEnd === -1) break;
      const header = buffer.slice(0, headerEnd).toString('utf8');
      const match = header.match(/content-length:\s*(\d+)/i);
      if (!match) {
        buffer = buffer.slice(headerEnd + 4);
        continue;
      }
      const length = Number(match[1]);
      const bodyStart = headerEnd + 4;
      const bodyEnd = bodyStart + length;
      if (buffer.length < bodyEnd) break;
      const body = buffer.slice(bodyStart, bodyEnd).toString('utf8');
      buffer = buffer.slice(bodyEnd);
      try {
        handleRpc(JSON.parse(body));
      } catch (error) {
        appendLog({ type: 'badJsonRpc', error: error.message });
      }
    }
  });
}

function cliStatus() {
  return ensureBridge().then(async (bridge) => ({
    ok: bridge.ok,
    version: VERSION,
    bridge: bridge && bridge.health ? { ...bridge, health: compactHealth(bridge.health) } : bridge,
    health: bridge.ok ? compactHealth(await requestBridge('GET', '/health', undefined, 2000)) : null,
    mcpTransport: bridge.ok ? compactTransport(await requestBridge('GET', '/codex/mcp-transport', undefined, 2000)) : null,
    tools: toolsList().length,
  }));
}

function print(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

async function cliSmoke() {
  const initialize = { ok: true, method: 'initialize', serverInfo: { name: 'codex-studiobridge-mcp-proxy', version: VERSION } };
  const tools = toolsList();
  const bridge = await callTool('bridge_health', {});
  const studios = await callTool('list_roblox_studios', {});
  const state = await callTool('get_studio_state', {});
  return {
    ok: bridge.ok !== false && studios.ok !== false && state.ok !== false,
    version: VERSION,
    initialize,
    toolCount: tools.length,
    bridge: redacted(bridge),
    list_roblox_studios: redacted(studios),
    get_studio_state: redacted(state),
  };
}

async function main() {
  const [arg] = process.argv.slice(2);
  if (arg === '--status') {
    print(await cliStatus());
    return;
  }
  if (arg === '--tools') {
    print({ ok: true, version: VERSION, tools: toolsList() });
    return;
  }
  if (arg === '--smoke') {
    print(await cliSmoke());
    return;
  }
  runStdioServer();
}

main().catch((error) => {
  appendLog({ type: 'fatal', error: error.stack || error.message });
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
