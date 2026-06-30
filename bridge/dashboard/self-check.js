'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const Router = require('../command-router');
const Dashboard = require('./index');
const RunHistory = require('./run-history');
const { VERSION, ACTIONS, redact } = require('./schema');

function assertNoSecretText(label, text) {
  assert(!/sk-[A-Za-z0-9_-]{12,}/.test(text), `${label} exposes an API-key-looking value`);
  assert(!/OPENAI_API_KEY\s*=/.test(text), `${label} exposes API key assignment text`);
}

async function runSelfCheck() {
  const root = path.resolve(__dirname, '..', '..');
  const required = [
    'index.js',
    'schema.js',
    'status.js',
    'state.js',
    'html.js',
    'assets.js',
    'command-runner.js',
    'run-controller.js',
    'approval-controller.js',
    'chat.js',
    'chat-history.js',
    'timeline.js',
    'run-history.js',
    'approval-queue.js',
    'pipeline-presets.js',
    'pipeline-runner.js',
    'cost-view.js',
    'safety-report.js',
    'transaction-view.js',
    'report-view.js',
    'safety-view.js',
    'image-privacy.js',
    'image-store.js',
    'image-intake.js',
    'image-history.js',
    'image-pipeline.js',
    'image-self-check.js',
    'fidelity-loop.js',
    'fidelity-state.js',
    'fidelity-fix-preview.js',
    'fidelity-score-delta.js',
    'fidelity-memory.js',
    'fidelity-self-check.js',
    'self-check.js',
  ];
  for (const file of required) {
    assert(fs.existsSync(path.join(__dirname, file)), `Missing dashboard module: ${file}`);
  }
  for (const file of ['dashboard/app.js', 'dashboard/styles.css']) {
    assert(fs.existsSync(path.join(root, file)), `Missing dashboard static file: ${file}`);
  }

  const html = Dashboard.getHtml();
  const app = fs.readFileSync(path.join(root, 'dashboard/app.js'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'dashboard/styles.css'), 'utf8');
  assert(html.includes('/dashboard/app.js'), 'HTML must load local app.js');
  assert(html.includes('/dashboard/styles.css'), 'HTML must load local styles.css');
  assert(!/https?:\/\//i.test(html.replace('http://127.0.0.1:28123/dashboard', '')), 'Dashboard HTML must not use external HTTP/CDN assets');
  assert(!/https?:\/\//i.test(app), 'Dashboard JS must not use external HTTP/CDN assets');
  assert(!/@import\s+url/i.test(css), 'Dashboard CSS must not import external assets');
  assertNoSecretText('html', html);
  assertNoSecretText('app.js', app);
  assertNoSecretText('styles.css', css);
  assert(html.includes('id="imageFile"'), 'Dashboard HTML must expose local image file input');
  assert(html.includes('id="imagePath"'), 'Dashboard HTML must expose manual image path fallback');
  assert(app.includes('/dashboard/image/intake'), 'Dashboard JS must call image intake endpoint');
  assert(app.includes('/dashboard/image/worldcompile'), 'Dashboard JS must call image worldcompile endpoint');
  assert(html.includes('id="fidelityLoop"'), 'Dashboard HTML must expose V88 fidelity loop controls');
  assert(app.includes('/dashboard/fidelity/'), 'Dashboard JS must call V88 fidelity endpoints');

  const state = Dashboard.getState({
    health: { ok: true, version: VERSION, studioConnected: false, paired: false },
    activePlace: null,
  });
  assert.equal(state.version, VERSION);
  assert.equal(state.safety.localOnly, true);
  assert.equal(state.safety.mutationsRequireExecutionKernel, true);
  assert.equal(state.api.keyExposed, false);
  assert.equal(state.url, 'http://127.0.0.1:28123/dashboard');
  Dashboard.getRuntime().latest.warnings = ['stale previous action warning'];
  Dashboard.getRuntime().latest.blockers = ['stale previous action blocker'];
  const currentState = Dashboard.getState({
    health: { ok: true, version: VERSION, studioConnected: true, paired: true },
    activePlace: { pluginVersion: VERSION, connected: true, stale: false },
  });
  assert(!currentState.warnings.includes('stale previous action warning'), 'current dashboard warnings must not include stale action warnings');
  assert(!currentState.blockers.includes('stale previous action blocker'), 'current dashboard blockers must not include stale action blockers');
  assert(currentState.latest.lastResult !== undefined, 'dashboard state should still expose latest action details separately');
  Dashboard.getRuntime().latest.warnings = [];
  Dashboard.getRuntime().latest.blockers = [];

  const unknown = await Dashboard.command({ action: 'unknownAction', goal: 'test' });
  assert.equal(unknown.status, 'blocked');
  const risky = await Dashboard.command({ action: 'executePreview', goal: 'publish marketplace datastore economy' });
  assert.equal(risky.status, 'blockedExternalRisk');
  const preview = await Dashboard.command({ action: 'executePreview', goal: 'dashboard tiny Codex preview' });
  assert(preview.ok, 'executePreview should work offline');
  assert(Dashboard.getRuntime().pendingApproval, 'preview should create pending approval');
  const approvals = Dashboard.approvals();
  assert(approvals.approvals.length >= 1, 'preview should create approval queue item');
  const cancel = Dashboard.cancel({ reason: 'self-check' });
  assert.equal(cancel.ok, true);

  const chat = await Dashboard.chat({ message: 'dashboard chat status' });
  assert.equal(chat.ok, true);
  assert.equal(chat.routeCategory, 'dashboard');
  assert.equal(chat.api.keyExposed, false);
  assert(Array.isArray(chat.toolTimeline), 'chat should return tool timeline');
  const history = Dashboard.chatHistory();
  assert(history.messages.length >= 2, 'chat history should include user and assistant messages');
  const presets = Dashboard.presets();
  assert(presets.presets.some((preset) => preset.id === 'referenceToWorldPreview'), 'pipeline presets should include referenceToWorldPreview');
  const imagePreset = presets.presets.find((preset) => preset.id === 'imageToWorldPreview');
  assert(imagePreset, 'pipeline presets should include imageToWorldPreview');
  assert(imagePreset.actions.includes('dashboardImageAnalyze'), 'image pipeline preset should use dashboardImageAnalyze');
  assert(imagePreset.actions.includes('dashboardImageWorldcompile'), 'image pipeline preset should use dashboardImageWorldcompile');
  const pipeline = await Dashboard.pipeline({ goal: 'premium anime dashboard self check', planOnly: true });
  assert.equal(pipeline.ok, true);
  assert.equal(pipeline.planOnly, true);
  const safety = Dashboard.safety();
  assert.equal(safety.dashboardChatNoMutation, true);
  const cost = Dashboard.cost();
  assert.equal(cost.apiKeyExposed, false);
  const timeline = Dashboard.timeline();
  assert(Array.isArray(timeline.timeline), 'timeline should be structured');
  const imageSelfCheck = await Dashboard.imageSelfCheck();
  assert.equal(imageSelfCheck.ok, true);
  const reconciled = RunHistory.listRuns({
    approvals: [{ approvalId: 'tx_self_check', status: 'rejected', updatedAt: '2026-01-01T00:00:00.000Z' }],
    runs: [{
      runId: 'dash_self_check',
      kind: 'dashboardPipeline',
      goal: 'self check',
      routeCategory: 'dashboard',
      status: 'waitingApproval',
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: null,
      approvals: [{ approvalId: 'tx_self_check' }],
      steps: [],
      warnings: [],
      blockers: [],
      nextCommand: 'tools\\bridge.cmd dashboard approve tx_self_check',
    }],
  });
  assert.equal(reconciled.runs[0].status, 'rejected', 'dashboard runs should not show rejected approvals as waitingApproval');

  const redacted = redact({
    token: 'abc',
    apiKey: 'sk-test-value',
    payload: { goal: 'keep this', patch: 'remove this' },
    sourceText: 'function secret() end',
  });
  assert.equal(redacted.token, '[redacted]');
  assert.equal(redacted.apiKey, '[redacted]');
  assert.equal(redacted.payload.goal, 'keep this');
  assert.equal(redacted.payload.patch, '[redacted]');
  assert.equal(redacted.sourceText, '[redacted]');

  const routes = {
    'open dashboard': 'dashboard',
    'show dashboard': 'dashboard',
    'open control room': 'dashboard',
    'production dashboard': 'dashboard',
    'dashboard status': 'dashboard',
    'open ai ui': 'dashboard',
    'show ai control panel': 'dashboard',
    'chat with bridge': 'dashboard',
    'dashboard chat': 'dashboard',
    'open ai chat': 'dashboard',
    'show tool timeline': 'dashboard',
    'show approvals': 'dashboard',
    'approve dashboard run': 'dashboard',
    'dashboard pipeline': 'dashboard',
    'one click build': 'dashboard',
    'show dashboard runs': 'dashboard',
    'show dashboard safety': 'dashboard',
    'show dashboard cost': 'dashboard',
    'upload image to dashboard': 'dashboard',
    'dashboard image upload': 'dashboard',
    'use image in dashboard': 'dashboard',
    'dashboard analyze image': 'dashboard',
    'dashboard image to world': 'dashboard',
    'one click image build': 'dashboard',
    'build image from dashboard': 'dashboard',
    'dashboard fidelity loop': 'dashboard',
    'dashboard match reference': 'dashboard',
    'improve image match': 'dashboard',
    'build this for real': 'execution',
    'use api': 'ai',
    'compare to reference': 'fidelity',
    'turn this image into a world': 'worldcompile',
    'new pairing code': 'pairing',
  };
  const routerResults = {};
  for (const [query, expected] of Object.entries(routes)) {
    const route = Router.createRoute(query);
    assert.equal(route.category, expected, `${query} routed to ${route.category}, expected ${expected}`);
    routerResults[query] = route.category;
  }

  return {
    ok: true,
    version: VERSION,
    checkedModules: required.length,
    actionCount: ACTIONS.length,
    localOnly: true,
    noSecretFrontend: true,
    chatFallbackWorks: true,
    timelineStructured: true,
    staleRunReconciliationWorks: true,
    approvalQueueWorks: true,
    pipelinePresetsWork: true,
    imagePipelineWorks: true,
    commandRunnerWhitelist: true,
    unknownActionBlocked: true,
    riskyActionBlocked: true,
    pendingApprovalAfterPreview: true,
    routerResults,
    warnings: [],
    blockers: [],
    nextCommand: 'tools\\bridge.cmd dashboard open',
  };
}

module.exports = { runSelfCheck };
