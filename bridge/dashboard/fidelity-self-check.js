'use strict';

const assert = require('node:assert/strict');
const Dashboard = require('./index');
const Router = require('../command-router');
const { VERSION } = require('./schema');

function assertNoSecretText(label, text) {
  assert(!/sk-[A-Za-z0-9_-]{12,}/.test(text), `${label} exposes an API-key-looking value`);
  assert(!/OPENAI_API_KEY\s*=/.test(text), `${label} exposes API key assignment text`);
  assert(!/data:image\/[a-z]+;base64/i.test(text), `${label} exposes raw image data`);
}

async function runSelfCheck() {
  const goal = 'dark purple anime dungeon gate with glowing portal';
  const stateBefore = Dashboard.fidelityState();
  assert.equal(stateBefore.version, VERSION);
  assert.equal(stateBefore.ok, true);

  const compare = await Dashboard.fidelityCompare({ goal });
  assert.equal(compare.version, VERSION);
  assert.equal(compare.ok, true);
  assert(compare.loopId, 'compare should create a loop id');
  assert.equal(compare.actualReferenceVisionUsed, false);
  assert.equal(compare.actualStudioPixelsUsed, false);
  assert(Array.isArray(compare.mismatches), 'compare should expose mismatches');

  const fixPlan = await Dashboard.fidelityFixPlan({ goal, loopId: compare.loopId });
  assert.equal(fixPlan.ok, true);
  assert(Array.isArray(fixPlan.safeFixes), 'fix plan should expose safeFixes');
  assert(Array.isArray(fixPlan.manualRequired), 'fix plan should expose manualRequired');

  const preview = await Dashboard.fidelityPreview({ goal, loopId: compare.loopId });
  assert.equal(preview.version, VERSION);
  assert(preview.transactionId, 'preview should create a V72 transaction id');
  assert(preview.pendingApproval, 'preview should create a dashboard approval');

  const approvals = Dashboard.approvals();
  assert(approvals.approvals.some((approval) => approval.approvalId === preview.transactionId), 'approval queue should include preview transaction');

  const recompare = await Dashboard.fidelityRecompare({ goal, loopId: compare.loopId });
  assert.equal(recompare.ok, true);
  assert(Object.prototype.hasOwnProperty.call(recompare, 'scoreDelta'), 'recompare should expose scoreDelta');

  const qa = await Dashboard.fidelityQa({ goal, loopId: compare.loopId });
  assert.equal(qa.ok, true);
  assert(Object.prototype.hasOwnProperty.call(qa, 'qaScore'), 'QA result should expose score');

  const learn = await Dashboard.fidelityLearn({ goal, loopId: compare.loopId });
  assert.equal(learn.ok, true);

  const stateAfter = Dashboard.fidelityState();
  assert.equal(stateAfter.latestLoopId, compare.loopId);
  assert(stateAfter.latest, 'state should include latest loop');

  Dashboard.cancel({ reason: 'dashboard-fidelity-self-check' });

  const expectedRoutes = {
    'dashboard fidelity loop': 'dashboard',
    'dashboard match reference': 'dashboard',
    'improve reference match': 'dashboard',
    'fix fidelity in dashboard': 'dashboard',
    'one click fidelity fix': 'dashboard',
    'improve image match': 'dashboard',
    'make dashboard build closer to reference': 'dashboard',
    'dashboard compare and fix': 'dashboard',
    'compare to reference': 'fidelity',
    'turn this image into a world': 'worldcompile',
    'build this for real': 'execution',
    'new pairing code': 'pairing',
  };
  const routerResults = {};
  for (const [query, expected] of Object.entries(expectedRoutes)) {
    const route = Router.createRoute(query);
    assert.equal(route.category, expected, `${query} routed to ${route.category}, expected ${expected}`);
    routerResults[query] = route.category;
  }

  const serialized = JSON.stringify({ compare, fixPlan, preview, recompare, qa, learn, stateAfter });
  assertNoSecretText('dashboard fidelity self-check result', serialized);

  return {
    ok: true,
    version: VERSION,
    checked: [
      'state',
      'compare',
      'fixPlan',
      'previewApproval',
      'recompareDelta',
      'qa',
      'memoryLearn',
      'routerPriority',
      'noSecrets',
      'noRawImageBytes',
    ],
    loopId: compare.loopId,
    transactionId: preview.transactionId,
    routerResults,
    warnings: [],
    blockers: [],
    nextCommand: 'tools\\bridge.cmd dashboard fidelity-loop "dark purple anime dungeon gate"',
  };
}

module.exports = { runSelfCheck };
