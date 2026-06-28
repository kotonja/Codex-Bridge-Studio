'use strict';

const fs = require('fs');
const path = require('path');
const Autopilot = require('./index');
const QaSwarm = require('../qa-swarm');
const Cinematic = require('../cinematic');
const AssetForge = require('../assetforge');
const Worldgen = require('../worldgen');
const Visual = require('../visual');
const Premium = require('../premium');
const { createRoute } = require('../command-router');

const MODULES = [
  'index.js',
  'schema.js',
  'status.js',
  'goal-parser.js',
  'loop-policy.js',
  'production-plan.js',
  'loop-planner.js',
  'round-planner.js',
  'specialist-router.js',
  'evidence-pack.js',
  'issue-normalizer.js',
  'blocker-detector.js',
  'safe-fix-planner.js',
  'safe-apply-planner.js',
  'polish-planner.js',
  'retest-planner.js',
  'score-aggregator.js',
  'stop-conditions.js',
  'rollback-plan.js',
  'manifest-store.js',
  'final-report.js',
  'self-check.js',
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function checkPolicy(policy) {
  for (const key of ['maxRounds', 'maxMutationsPerRound', 'maxRuntimeMs', 'stopConditions']) assert(policy[key] !== undefined, `policy ${policy.id} missing ${key}`);
}

function run() {
  const missing = MODULES.filter((file) => !fs.existsSync(path.join(__dirname, file)));
  assert(missing.length === 0, `Missing Autopilot modules: ${missing.join(', ')}`);

  const goal = 'premium anime dungeon hub';
  const status = Autopilot.createStatus();
  const policies = Autopilot.listPolicies();
  const plan = Autopilot.createProductionPlan(goal);
  const loop = Autopilot.createLoopPlan(goal);
  const round = Autopilot.createRoundPlan(goal);
  const evidence = Autopilot.createEvidencePack(goal);
  const issueReport = Autopilot.createIssueReport(goal);
  const fixPlan = Autopilot.createFixPlan(goal);
  const applySafe = Autopilot.createSafeApplyPlan(goal);
  const polish = Autopilot.createPolishPlan(goal);
  const retest = Autopilot.createRetestPlan(goal);
  const score = Autopilot.createScoreReport(goal);
  const stopMaxRounds = Autopilot.evaluateStopConditions({ policy: Autopilot.createPolicy('safePreview'), roundIndex: 1, currentScore: 70 });
  const stopManual = Autopilot.evaluateStopConditions({ policy: Autopilot.createPolicy('fullPremiumLoop'), blockers: [{ severity: 'high', safety: 'manualRequired' }], currentScore: 70 });
  const stopStale = Autopilot.evaluateStopConditions({ policy: Autopilot.createPolicy('fullPremiumLoop'), studioStale: true, currentScore: 70 });
  const stopNoImprove = Autopilot.evaluateStopConditions({ policy: Autopilot.createPolicy('fullPremiumLoop'), scoreHistory: [80, 80], currentScore: 79 });
  const stopTarget = Autopilot.evaluateStopConditions({ policy: Autopilot.createPolicy('fullPremiumLoop'), currentScore: 90 });
  const finalReport = Autopilot.createFinalReport(goal);
  const manifest = Autopilot.createManifest(goal);

  assert(status.ok && status.version === '0.71.0', 'status version/shape failed');
  assert(status.capabilities.includes('boundedProductionLoops'), 'status missing boundedProductionLoops');
  assert(Object.values(status.integrations).every(Boolean), 'status integrations must be true');
  assert(policies.length === Autopilot.POLICY_IDS.length, 'all policies must exist');
  policies.forEach(checkPolicy);
  for (const key of ['version', 'goal', 'autopilotId', 'policyId', 'goalClass', 'specialists', 'rounds', 'acceptanceGates', 'safetyBudget', 'warnings', 'blockers', 'nextCommand']) assert(plan[key] !== undefined, `production plan missing ${key}`);
  for (const phase of Autopilot.PHASES) assert(loop.phases.some((item) => item.phase === phase), `loop missing phase ${phase}`);
  assert(loop.phases.length === 14, 'loop must include all 14 phases');
  for (const key of ['commands', 'expectedEvidence', 'allowedMutations', 'blockedActions', 'rollbackPlan']) assert(round[key] !== undefined, `round missing ${key}`);
  for (const source of Autopilot.EVIDENCE_SOURCES) {
    const item = evidence.sources.find((entry) => entry.source === source);
    assert(item, `evidence source missing ${source}`);
    if (!item.available) for (const key of ['available', 'reason', 'nextCommand']) assert(item[key] !== undefined, `unavailable evidence missing ${key}`);
  }
  const issue = issueReport.issues[0];
  for (const key of ['id', 'source', 'severity', 'category', 'title', 'evidence', 'createdBy', 'affectedPaths', 'exactFix', 'suggestedCommand', 'safeToAutoApply', 'safety']) assert(issue[key] !== undefined, `issue missing ${key}`);
  assert(fixPlan.actions.some((action) => action.safety === 'manualRequired' || String(action.command).startsWith('manualRequired')), 'safe fix plan must keep unsafe actions manualRequired');
  assert(applySafe.safeActions.every((action) => action.targetPaths.every((p) => /^Workspace\.Codex|^ReplicatedStorage\.Codex|^StarterGui\.Codex/.test(p))), 'apply-safe must only allow Codex-owned targets');
  assert(polish.stages.length >= 5, 'polish plan must include staged passes');
  assert(retest.commands.some((command) => command.includes('qa launch')), 'retest must use QA swarm');
  assert(score.finalScore >= 0 && score.finalScore <= 100 && score.rating, 'score/rating failed');
  assert(stopMaxRounds.shouldStop && /maxRounds/.test(stopMaxRounds.reason), 'maxRounds stop failed');
  assert(stopManual.shouldStop && /manualRequired/.test(stopManual.reason), 'manualRequired stop failed');
  assert(stopStale.shouldStop && stopStale.reason === 'staleStudio', 'stale Studio stop failed');
  assert(stopNoImprove.shouldStop && /no score improvement/.test(stopNoImprove.reason), 'no improvement stop failed');
  assert(stopTarget.shouldStop && /targetScore/.test(stopTarget.reason), 'target score stop failed');
  for (const key of ['scoreHistory', 'remainingIssues', 'manualRequired', 'skippedUnsafeActions']) assert(finalReport[key] !== undefined, `final report missing ${key}`);
  assert(manifest.manifestPath.includes('ReplicatedStorage.CodexAutopilot.Manifests'), 'manifest path root failed');

  const routes = {
    buildAndTestEverything: createRoute('build and test everything').category,
    premiumAutomatically: createRoute('make it premium automatically').category,
    improveUntilReady: createRoute('keep improving until ready').category,
    fullProductionLoop: createRoute('full production loop').category,
    testEverything: createRoute('test everything').category,
    cinematic: createRoute('make combat feel good').category,
    premium: createRoute('make premium anime dungeon hub').category,
    assetforge: createRoute('make premium props for anime dungeon').category,
    worldgen: createRoute('make a dungeon map').category,
    visual: createRoute('visual critique').category,
    vfx: createRoute('generate purple sword slash vfx').category,
    pairing: createRoute('new pairing code').category,
  };
  assert(routes.buildAndTestEverything === 'autopilot', 'build and test everything route must be autopilot');
  assert(routes.premiumAutomatically === 'autopilot', 'make it premium automatically route must be autopilot');
  assert(routes.improveUntilReady === 'autopilot', 'keep improving until ready route must be autopilot');
  assert(routes.fullProductionLoop === 'autopilot', 'full production loop route must be autopilot');
  assert(routes.testEverything === 'qa', 'test everything route must remain qa');
  assert(routes.cinematic === 'cinematic', 'cinematic route drifted');
  assert(routes.premium === 'premiumDirector', 'premium route drifted');
  assert(routes.assetforge === 'assetforge', 'assetforge route drifted');
  assert(routes.worldgen === 'worldgen', 'worldgen route drifted');
  assert(routes.visual === 'visual', 'visual route drifted');
  assert(routes.vfx === 'vfx', 'vfx route drifted');
  assert(routes.pairing === 'pairing', 'pairing route drifted');

  assert(QaSwarm.createStatus().version === '0.71.0', 'QA version drift');
  assert(Cinematic.createStatus().version === '0.71.0', 'cinematic version drift');
  assert(AssetForge.createStatus().version === '0.71.0', 'assetforge version drift');
  assert(Worldgen.createStatus().version === '0.71.0', 'worldgen version drift');
  assert(Visual.createStatus().version === '0.71.0', 'visual version drift');
  assert(Premium.getStatus().version === '0.71.0', 'premium version drift');

  return {
    ok: true,
    version: Autopilot.VERSION,
    moduleCount: MODULES.length,
    policyCount: policies.length,
    phaseCount: loop.phases.length,
    evidenceSourceCount: evidence.sources.length,
    issueCount: issueReport.issues.length,
    safeActionCount: applySafe.safeActions.length,
    score: score.finalScore,
    rating: score.rating,
    stopChecks: {
      maxRounds: stopMaxRounds.shouldStop,
      manualRequired: stopManual.shouldStop,
      staleStudio: stopStale.shouldStop,
      noImprovement: stopNoImprove.shouldStop,
      targetScore: stopTarget.shouldStop,
    },
    routes,
  };
}

module.exports = { run };
