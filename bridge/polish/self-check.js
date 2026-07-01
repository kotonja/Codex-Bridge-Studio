'use strict';

const assert = require('node:assert/strict');
const Router = require('../command-router');
const Polish = require('./index');

function routeCategory(query) {
  return Router.createRoute(query, { version: Polish.VERSION }).category;
}

function run() {
  const goal = 'premium dark purple anime dungeon gate hub';
  const status = Polish.createStatus();
  assert.equal(status.ok, true);
  assert.equal(status.version, '0.96.0');
  assert.equal(status.safety.executionRequiresV72, true);
  assert.equal(status.safety.approvalRequired, true);

  const baseline = Polish.createBaseline(goal);
  assert.equal(baseline.ok, true);
  for (const key of ['visual', 'fidelity', 'architecture', 'detail', 'materials', 'qa', 'premium', 'autopilot']) {
    assert.ok(Object.prototype.hasOwnProperty.call(baseline.scores, key), `missing baseline score ${key}`);
  }

  const issues = Polish.createIssueReport(goal, { baseline });
  assert.equal(issues.ok, true);
  assert.ok(issues.issueCount > 0, 'expected normalized issues');
  assert.ok(issues.issues.every((issue) => Array.isArray(issue.evidence)), 'issues need evidence arrays');

  const plan = Polish.createPlan(goal, { issueReport: issues });
  assert.equal(plan.ok, true);
  assert.ok(plan.safeActionCount >= 1, 'expected at least one safe action');
  assert.ok(plan.manualRequiredCount >= 0);
  assert.equal(plan.approvalRequired, true);
  assert.ok(plan.actions.every((action) => action.executionRequired === true));

  const preview = Polish.createPreview(goal, { plan });
  assert.equal(preview.ok, true);
  assert.equal(preview.executionCompatible, true);
  assert.equal(preview.approvalRequired, true);
  assert.ok(preview.operationCount > 0, 'preview must include V72 operations');
  assert.ok((preview.executionPreview.actions || []).every((action) => String(action.path || '').includes('Codex')), 'preview paths must be Codex-owned');

  const apply = Polish.apply(goal);
  assert.equal(apply.ok, false);
  assert.equal(apply.status, 'manualRequired');
  assert.equal(apply.approvalRequired, true);

  const rescore = Polish.createRescore(goal);
  assert.equal(rescore.ok, true);
  const delta = Polish.createDelta(goal, { baseline, after: rescore });
  assert.equal(delta.ok, true);
  assert.ok(Object.prototype.hasOwnProperty.call(delta.deltas, 'visual'));

  const learn = Polish.learn(goal, { delta, issueReport: issues });
  assert.equal(learn.ok, true);
  assert.equal(learn.noSecretsStored, true);

  const routes = {
    'polish the whole scene': 'polish',
    'improve the scene': 'polish',
    'fix scene issues': 'polish',
    'integrated polish': 'polish',
    'scene polish loop': 'polish',
    'safe scene fixes': 'polish',
    'make the scene better': 'polish',
    'polish all issues': 'polish',
    'run polish loop': 'polish',
    'improve materials': 'materials',
    'make better shapes': 'architecture',
    'make it less placeholder': 'detail',
    'compare to reference': 'fidelity',
    'build this for real': 'execution',
    'new pairing code': 'pairing',
  };
  for (const [query, expected] of Object.entries(routes)) {
    assert.equal(routeCategory(query), expected, `route ${query}`);
  }

  return {
    ok: true,
    version: Polish.VERSION,
    status: 'ready',
    checked: [
      'modules',
      'status',
      'baseline',
      'issue-normalizer',
      'safe-polish-plan',
      'execution-preview',
      'approval-required-apply',
      'rescore',
      'delta',
      'memory-learn-redaction-route',
      'router',
    ],
    baselineScores: baseline.scores,
    issueCount: issues.issueCount,
    safeActionCount: plan.safeActionCount,
    manualRequiredCount: plan.manualRequiredCount,
    previewOperationCount: preview.operationCount,
    deltaSample: delta.deltas,
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd polish baseline "${goal}"`,
  };
}

module.exports = { run };
