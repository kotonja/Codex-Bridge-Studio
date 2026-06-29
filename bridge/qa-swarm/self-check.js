'use strict';

const fs = require('fs');
const path = require('path');
const QaSwarm = require('./index');
const { createRoute } = require('../command-router');

const MODULES = [
  'index.js',
  'schema.js',
  'status.js',
  'persona-catalog.js',
  'goal-parser.js',
  'intent-plan.js',
  'swarm-planner.js',
  'scenario-planner.js',
  'route-test-planner.js',
  'ui-test-planner.js',
  'combat-test-planner.js',
  'economy-audit-planner.js',
  'multiplayer-test-planner.js',
  'performance-probe-planner.js',
  'regression-planner.js',
  'accessibility-audit-planner.js',
  'launch-readiness.js',
  'issue-report.js',
  'fix-plan.js',
  'scorecard.js',
  'evidence-pack.js',
  'manifest-store.js',
  'self-check.js',
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const missing = MODULES.filter((file) => !fs.existsSync(path.join(__dirname, file)));
  assert(missing.length === 0, `Missing QA Swarm modules: ${missing.join(', ')}`);

  const goal = 'premium anime dungeon hub launch QA';
  const status = QaSwarm.createStatus();
  const personas = QaSwarm.getPersonaCatalog();
  const plan = QaSwarm.createQaPlan(goal);
  const swarm = QaSwarm.createSwarmPlan(goal);
  const scenarios = QaSwarm.createScenarioCatalog(goal);
  const route = QaSwarm.createRouteTestPlan(goal);
  const ui = QaSwarm.createUiTestPlan(goal);
  const combat = QaSwarm.createCombatTestPlan(goal);
  const economy = QaSwarm.createEconomyAuditPlan(goal);
  const multiplayer = QaSwarm.createMultiplayerTestPlan(goal);
  const performance = QaSwarm.createPerformanceProbePlan(goal);
  const regression = QaSwarm.createRegressionPlan(goal);
  const accessibility = QaSwarm.createAccessibilityAuditPlan(goal);
  const launch = QaSwarm.createLaunchReadinessReport(goal);
  const issueReport = QaSwarm.createIssueReport(goal);
  const fixPlan = QaSwarm.createFixPlan(goal);
  const manifest = QaSwarm.createManifest(goal);

  assert(status.ok && status.version === '0.74.0', 'status version/shape failed');
  assert(personas.length >= 16, 'persona catalog must include at least 16 personas');
  for (const persona of personas) {
    for (const key of ['goal', 'mindset', 'explorationStrategy', 'interactionHabit', 'likelyFinds', 'deviceAssumption', 'failureSignals', 'testFocus', 'forbiddenActions', 'maxActions', 'evidenceNeeded']) assert(persona[key] !== undefined, `persona ${persona.id} missing ${key}`);
  }
  for (const key of ['version', 'goal', 'qaPlanId', 'scope', 'targetPlace', 'personas', 'scenarios', 'requiredEvidence', 'riskAreas', 'integrationsUsed', 'warnings', 'blockers', 'nextCommand']) assert(plan[key] !== undefined, `QA plan missing ${key}`);
  assert(swarm.agents.length >= 12 && swarm.scenarios.length >= 20 && swarm.schedule, 'swarm plan must include agents, scenarios, and schedule');
  for (const agent of swarm.agents) for (const key of ['scenarioIds', 'passCriteria', 'failCriteria']) assert(Array.isArray(agent[key]) && agent[key].length > 0, `agent ${agent.id} missing ${key}`);
  for (const scenarioId of QaSwarm.SCENARIO_IDS) assert(scenarios.some((scenario) => scenario.id === scenarioId), `scenario missing: ${scenarioId}`);
  for (const routeId of QaSwarm.ROUTE_IDS) assert(route.routes.some((item) => item.id === routeId), `route missing: ${routeId}`);
  for (const check of QaSwarm.UI_CHECKS) assert(ui.checks.some((item) => item.label === check), `UI check missing: ${check}`);
  for (const check of QaSwarm.COMBAT_CHECKS) assert(combat.checks.some((item) => item.label === check), `combat check missing: ${check}`);
  assert(economy.manualRequired && economy.checks.some((item) => item.safety === 'manualRequired'), 'economy unsafe flows must be manualRequired');
  assert(multiplayer.manualRequired && multiplayer.checks.length >= 7, 'multiplayer must be bounded/local/manualRequired when unavailable');
  assert(performance.metrics.every((metric) => metric.fakeProfilerReading === false), 'performance must not fake profiler readings');
  assert(regression.uses.outputBaseline && regression.uses.cinematicManifestReferences && regression.uses.duplicateStaleCommandDetection, 'regression must include baseline and manifest references');
  for (const check of QaSwarm.ACCESSIBILITY_CHECKS) assert(accessibility.checks.some((item) => item.label === check), `accessibility check missing: ${check}`);
  for (const key of QaSwarm.LAUNCH_SCORE_KEYS) assert(launch.subScores[key], `launch subscore missing: ${key}`);
  const issue = issueReport.issues[0];
  for (const key of ['severity', 'category', 'reproSteps', 'expected', 'actual', 'exactFix']) assert(issue[key] !== undefined, `issue shape missing ${key}`);
  for (const stage of QaSwarm.FIX_STAGES) assert(fixPlan.actions.some((action) => action.stage === stage), `fix stage missing: ${stage}`);
  for (const key of ['version', 'goal', 'qaPlanId', 'swarmId', 'warnings', 'blockers', 'nextCommand']) assert(manifest[key] !== undefined, `manifest missing ${key}`);

  const routes = {
    qaEverything: createRoute('test everything').category,
    launchQa: createRoute('full launch QA').category,
    publishReady: createRoute('is this ready to publish').category,
    cinematic: createRoute('make combat feel good').category,
    premium: createRoute('make premium anime dungeon hub').category,
    assetforge: createRoute('make premium props for anime dungeon').category,
    worldgen: createRoute('make a dungeon map').category,
    visual: createRoute('visual critique').category,
    vfx: createRoute('generate purple sword slash vfx').category,
    pairing: createRoute('new pairing code').category,
  };
  assert(routes.qaEverything === 'qa', 'test everything route must be qa');
  assert(routes.launchQa === 'qa', 'full launch QA route must be qa');
  assert(routes.publishReady === 'qa', 'publish readiness route must be qa');
  assert(routes.cinematic === 'cinematic', 'combat feel route must stay cinematic');
  assert(routes.premium === 'premiumDirector', 'premium route must stay premiumDirector');
  assert(routes.assetforge === 'assetforge', 'asset route must stay assetforge');
  assert(routes.worldgen === 'worldgen', 'worldgen route must stay worldgen');
  assert(routes.visual === 'visual', 'visual route must stay visual');
  assert(routes.vfx === 'vfx', 'vfx route must stay vfx');
  assert(routes.pairing === 'pairing', 'pairing route must stay pairing');

  return {
    ok: true,
    version: QaSwarm.VERSION,
    moduleCount: MODULES.length,
    personaCount: personas.length,
    scenarioCount: scenarios.length,
    agentCount: swarm.agents.length,
    routeCount: route.routes.length,
    uiCheckCount: ui.checks.length,
    combatCheckCount: combat.checks.length,
    launchScoreKeys: Object.keys(launch.subScores).length,
    launchReadinessScore: launch.launchReadinessScore,
    rating: launch.rating,
    fixStages: fixPlan.actions.length,
    routes,
    economyManualRequired: economy.manualRequired,
    multiplayerManualRequired: multiplayer.manualRequired,
    fakeProfilerReadings: performance.metrics.filter((metric) => metric.fakeProfilerReading).length,
  };
}

module.exports = { run };
