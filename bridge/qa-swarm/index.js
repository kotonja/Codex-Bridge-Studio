'use strict';

const { ACCESSIBILITY_CHECKS, COMBAT_CHECKS, ECONOMY_CHECKS, FIX_STAGES, LAUNCH_SCORE_KEYS, PERSONA_IDS, ROOTS, ROUTE_IDS, SCENARIO_IDS, UI_CHECKS, VERSION, nowIso } = require('./schema');
const { createStatus } = require('./status');
const { getPersonaCatalog } = require('./persona-catalog');
const { parseGoal } = require('./goal-parser');
const { createQaPlan } = require('./intent-plan');
const { createSwarmPlan } = require('./swarm-planner');
const { createScenarioCatalog } = require('./scenario-planner');
const { createRouteTestPlan } = require('./route-test-planner');
const { createUiTestPlan } = require('./ui-test-planner');
const { createCombatTestPlan } = require('./combat-test-planner');
const { createEconomyAuditPlan } = require('./economy-audit-planner');
const { createMultiplayerTestPlan } = require('./multiplayer-test-planner');
const { createPerformanceProbePlan } = require('./performance-probe-planner');
const { createRegressionPlan } = require('./regression-planner');
const { createAccessibilityAuditPlan } = require('./accessibility-audit-planner');
const { createLaunchReadinessReport } = require('./launch-readiness');
const { createIssueReport } = require('./issue-report');
const { createFixPlan } = require('./fix-plan');
const { createEvidencePack } = require('./evidence-pack');
const { createManifest, manifestPath } = require('./manifest-store');

function createRunPlan(goal, options = {}) {
  const parsed = parseGoal(goal);
  const plan = createQaPlan(parsed.goal);
  const swarm = createSwarmPlan(parsed.goal);
  const launch = createLaunchReadinessReport(parsed.goal);
  const issues = createIssueReport(parsed.goal).issues;
  const studioConnected = options.studioConnected === true;
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: parsed.goal,
    qaPlanId: parsed.qaPlanId,
    swarmId: parsed.swarmId,
    runId: parsed.runId,
    status: studioConnected ? 'codexOwnedQaRunPlan' : 'manualRequired',
    manualRequired: !studioConnected,
    manualRequiredReason: studioConnected ? null : 'Studio/Play/Test evidence is unavailable; V69 returns a bounded run plan instead of faking test execution.',
    createdPaths: studioConnected ? [
      `${ROOTS.replicatedStorage}.SwarmRuns.${parsed.runId}`,
      `${ROOTS.workspace}.${parsed.runId}`,
    ] : [],
    evidence: createEvidencePack(parsed.goal).evidenceTargets,
    issues,
    score: launch.launchReadinessScore,
    launchReadiness: launch,
    plan,
    swarm,
    warnings: studioConnected ? [] : ['Run connect/play/watch before claiming live QA execution.'],
    blockers: [],
    nextCommand: studioConnected ? `tools\\bridge.cmd qa launch "${parsed.goal}"` : 'tools\\bridge.cmd connect',
  };
}

function createReport(goal) {
  const parsed = parseGoal(goal);
  const launch = createLaunchReadinessReport(parsed.goal);
  const issueReport = createIssueReport(parsed.goal);
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: parsed.goal,
    summary: `QA Swarm rates "${parsed.goal}" as ${launch.rating} (${launch.launchReadinessScore}/100).`,
    launchReadiness: launch,
    issues: issueReport.issues,
    evidence: createEvidencePack(parsed.goal).evidenceTargets,
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd qa fix-plan "${parsed.goal}"`,
  };
}

function createManifestReport(goal) {
  const parsed = parseGoal(goal);
  return createManifest(parsed.goal, {
    plan: createQaPlan(parsed.goal),
    swarm: createSwarmPlan(parsed.goal),
    launchReadiness: createLaunchReadinessReport(parsed.goal),
    issues: createIssueReport(parsed.goal).issues,
    fixPlan: createFixPlan(parsed.goal),
  });
}

module.exports = {
  ACCESSIBILITY_CHECKS,
  COMBAT_CHECKS,
  ECONOMY_CHECKS,
  FIX_STAGES,
  LAUNCH_SCORE_KEYS,
  PERSONA_IDS,
  ROOTS,
  ROUTE_IDS,
  SCENARIO_IDS,
  UI_CHECKS,
  VERSION,
  createAccessibilityAuditPlan,
  createCombatTestPlan,
  createEconomyAuditPlan,
  createEvidencePack,
  createFixPlan,
  createIssueReport,
  createLaunchReadinessReport,
  createManifest: createManifestReport,
  createMultiplayerTestPlan,
  createPerformanceProbePlan,
  createQaPlan,
  createRegressionPlan,
  createReport,
  createRouteTestPlan,
  createRunPlan,
  createScenarioCatalog,
  createStatus,
  createSwarmPlan,
  createUiTestPlan,
  getPersonaCatalog,
  manifestPath,
  parseGoal,
};
