'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Router = require('../command-router');
const Execution = require('../execution');
const Memory = require('../memory');
const Autopilot = require('../autopilot');
const QaSwarm = require('../qa-swarm');
const Cinematic = require('../cinematic');
const AssetForge = require('../assetforge');
const Worldgen = require('../worldgen');
const Visual = require('../visual');
const Premium = require('../premium');
const Ai = require('./index');
const { getApiKeyInfo, assertNoSecretText, redact } = require('./secret-policy');
const { getFunctionSchemas } = require('./function-schemas');
const { VERSION } = require('./schema');
const { mutationGate } = require('./approval-gates');

async function runSelfCheck() {
  const required = [
    'index.js', 'schema.js', 'status.js', 'config.js', 'secret-policy.js', 'model-catalog.js', 'tool-catalog.js',
    'function-schemas.js', 'prompt-pack.js', 'response-contracts.js', 'run-store.js', 'run-state.js',
    'tool-runner.js', 'planner.js', 'reference-intake.js', 'approval-gates.js', 'cost-tracker.js',
    'connectivity.js',
    'safety-policy.js', 'report.js', 'self-check.js',
  ];
  for (const file of required) assert(fs.existsSync(path.join(__dirname, file)), `Missing AI module ${file}`);
  const status = Ai.getStatus();
  assert.equal(status.version, VERSION);
  assert.equal(status.pluginHasApiKey, false);
  const config = Ai.getConfig();
  assert.equal(config.pluginHasApiKey, false);
  const connectivity = Ai.getConnectivitySummary();
  assert(connectivity && typeof connectivity.status === 'string', 'AI connectivity summary missing status');
  assert.equal(assertNoSecretText(JSON.stringify(connectivity), 'connectivitySummary').ok, true);
  const schemas = getFunctionSchemas();
  const requiredTools = ['memory_recommend', 'premium_plan', 'worldgen_graph', 'assetforge_kit', 'cinematic_timeline', 'execute_preview', 'execute_apply', 'execute_verify', 'execute_rollback', 'visual_critique', 'qa_launch', 'autopilot_report', 'memory_learn'];
  const schemaNames = schemas.schemas.map((schema) => schema.name);
  for (const name of requiredTools) assert(schemaNames.includes(name), `Missing AI tool schema ${name}`);
  for (const schema of schemas.schemas) {
    assert.equal(schema.parameters.type, 'object', `${schema.name} missing JSON object parameters`);
    assert(typeof schema.safetyClass === 'string' && schema.safetyClass, `${schema.name} missing safety class`);
  }
  const plan = Ai.offlinePlan('premium anime dungeon hub');
  assert.equal(plan.configured, false);
  assert(plan.steps.some((step) => step.tool === 'execute_preview'));
  const reference = Ai.intakeReference('premium anime dungeon hub reference note');
  assert.equal(reference.actualImageAnalysis, false);
  assert.equal(reference.futureV74ImageUnderstanding, true);
  const run = await Ai.runProduction('premium anime dungeon hub', { model: 'local-test-model' });
  assert(run.runId && run.status === 'planned');
  const gate = mutationGate(run, 'execute_apply');
  assert.equal(gate.ok, false);
  assert.equal(gate.status, 'waitingApproval');
  assert(Ai.approveRun(run.runId).approvals.some((approval) => approval.status === 'approved'));
  const report = Ai.getRunReport(run.runId);
  assert.equal(assertNoSecretText(JSON.stringify(report), 'runReport').ok, true);
  assert.equal(assertNoSecretText(fs.readFileSync(path.join(process.cwd(), 'plugin', 'CodexStudioBridge.plugin.lua'), 'utf8'), 'pluginBundle').ok, true);
  assert.equal(assertNoSecretText(fs.readFileSync(path.join(process.cwd(), 'README.md'), 'utf8'), 'README').ok, true);
  assert.equal(assertNoSecretText(fs.readFileSync(path.join(process.cwd(), 'AGENTS.md'), 'utf8'), 'AGENTS').ok, true);
  assert.equal(Router.createRoute('use api').category, 'ai');
  assert.equal(Router.createRoute('run with api').category, 'ai');
  assert.equal(Router.createRoute('ai orchestrator').category, 'ai');
  assert.equal(Router.createRoute('use openai api').category, 'ai');
  assert.equal(Router.createRoute('api premium run').category, 'ai');
  assert.equal(Router.createRoute('build this for real').category, 'execution');
  assert.equal(Router.createRoute('build and test everything').category, 'autopilot');
  assert.equal(Router.createRoute('remember this style').category, 'memory');
  assert.equal(Router.createRoute('test everything').category, 'qa');
  assert.equal(Router.createRoute('make combat feel good').category, 'cinematic');
  assert.equal(Router.createRoute('make premium anime dungeon hub').category, 'premiumDirector');
  assert.equal(Router.createRoute('make premium props for anime dungeon').category, 'assetforge');
  assert.equal(Router.createRoute('make a dungeon map').category, 'worldgen');
  assert.equal(Router.createRoute('visual critique').category, 'visual');
  assert.equal(Router.createRoute('generate purple sword slash vfx').category, 'vfx');
  assert.equal(Router.createRoute('new pairing code').category, 'pairing');
  assert.equal(Execution.createStatus().version, VERSION);
  assert.equal(Memory.getProductionMemoryStatus().version, VERSION);
  assert.equal(Autopilot.createStatus().version, VERSION);
  assert.equal(QaSwarm.createStatus().version, VERSION);
  assert.equal(Cinematic.createStatus().version, VERSION);
  assert.equal(AssetForge.createStatus().version, VERSION);
  assert.equal(Worldgen.createStatus().version, VERSION);
  assert.equal(Visual.createStatus().version, VERSION);
  assert.equal(Premium.getStatus().version, VERSION);
  return {
    ok: true,
    version: VERSION,
    configured: getApiKeyInfo().configured,
    checked: ['modules', 'status', 'config', 'connectivitySummary', 'secretRedaction', 'toolCatalog', 'functionSchemas', 'offlinePlan', 'referenceIntake', 'runState', 'approvalGates', 'router', 'specialistVersions'],
    redaction: redact({ apiKey: getApiKeyInfo().key || 'none' }),
    nextCommand: 'tools\\bridge.cmd ai status',
  };
}

if (require.main === module) {
  runSelfCheck()
    .then((result) => {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    })
    .catch((error) => {
      process.stderr.write(`${error.stack || error.message}\n`);
      process.exit(1);
    });
}

module.exports = {
  runSelfCheck,
};
