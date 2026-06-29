'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Dashboard = require('../bridge/dashboard');
const Router = require('../bridge/command-router');
const { VERSION } = require('../bridge/dashboard/schema');

function assertNoSecretText(label, text) {
  assert(!/sk-[A-Za-z0-9_-]{12,}/.test(text), `${label} exposes an API-key-looking value`);
  assert(!/OPENAI_API_KEY\s*=/.test(text), `${label} exposes API key assignment text`);
}

async function main() {
  const root = path.resolve(__dirname, '..');
  const chat = await Dashboard.chat({ message: 'dashboard chat what should I do next' });
  assert.equal(chat.version, VERSION);
  assert.equal(chat.ok, true);
  assert.equal(chat.routeCategory, 'dashboard');
  assert.equal(chat.api.keyExposed, false);
  assert(Array.isArray(chat.toolTimeline));
  assert(chat.toolTimeline.length >= 2);

  const history = Dashboard.chatHistory();
  assert(history.messages.length >= 2);
  const timeline = Dashboard.timeline();
  assert(Array.isArray(timeline.timeline));
  const presets = Dashboard.presets();
  assert(presets.presets.some((preset) => preset.id === 'referenceToWorldApply'));
  const pipeline = await Dashboard.pipeline({ goal: 'premium anime dashboard chat self check', planOnly: true });
  assert.equal(pipeline.planOnly, true);
  assert(Array.isArray(pipeline.steps));
  const cost = Dashboard.cost();
  assert.equal(cost.frontendHasApiKey, false);
  const safety = Dashboard.safety();
  assert.equal(safety.localOnly, true);
  assert.equal(safety.dashboardChatNoMutation, true);

  const preview = await Dashboard.command({ action: 'executePreview', goal: 'dashboard chat approval self check' });
  assert(preview.ok);
  const approvals = Dashboard.approvals();
  assert(approvals.approvals.length >= 1);
  Dashboard.cancel({ reason: 'dashboard-chat-self-check' });

  const expectedRoutes = {
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
    'use api': 'ai',
    'build this for real': 'execution',
    'generate purple sword slash vfx': 'vfx',
    'new pairing code': 'pairing',
  };
  const routerResults = {};
  for (const [query, expected] of Object.entries(expectedRoutes)) {
    const route = Router.createRoute(query);
    assert.equal(route.category, expected, `${query} routed to ${route.category}, expected ${expected}`);
    routerResults[query] = route.category;
  }

  const html = Dashboard.getHtml();
  const app = fs.readFileSync(path.join(root, 'dashboard', 'app.js'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'dashboard', 'styles.css'), 'utf8');
  assert(!/https?:\/\//i.test(html.replace('http://127.0.0.1:28123/dashboard', '')));
  assert(!/https?:\/\//i.test(app));
  assert(!/@import\s+url/i.test(css));
  assertNoSecretText('html', html);
  assertNoSecretText('app.js', app);
  assertNoSecretText('styles.css', css);

  console.log(JSON.stringify({
    ok: true,
    version: VERSION,
    checked: ['chat', 'history', 'timeline', 'presets', 'pipelinePlan', 'cost', 'safety', 'approvalQueue', 'router', 'frontendNoSecrets'],
    routerResults,
  }, null, 2));
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
});
