'use strict';

const { CAPABILITIES, DEFAULT_POLICY, EVIDENCE_SOURCES, FIX_STAGES, INTEGRATIONS, PHASES, POLICY_IDS, ROOTS, SCORE_KEYS, VERSION } = require('./schema');
const { createStatus } = require('./status');
const { parseGoal } = require('./goal-parser');
const { createPolicy, listPolicies } = require('./loop-policy');
const { createProductionPlan } = require('./production-plan');
const { createLoopPlan } = require('./loop-planner');
const { createRoundPlan } = require('./round-planner');
const { routeSpecialists, SPECIALISTS } = require('./specialist-router');
const { createEvidencePack } = require('./evidence-pack');
const { createIssueReport } = require('./issue-normalizer');
const { detectBlockers } = require('./blocker-detector');
const { createFixPlan } = require('./safe-fix-planner');
const { createSafeApplyPlan } = require('./safe-apply-planner');
const { createPolishPlan } = require('./polish-planner');
const { createRetestPlan } = require('./retest-planner');
const { createScoreReport } = require('./score-aggregator');
const { evaluateStopConditions } = require('./stop-conditions');
const { createRollbackPlan } = require('./rollback-plan');
const { createManifest, manifestPath } = require('./manifest-store');
const { createFinalReport } = require('./final-report');

function createRunPlan(goal, options = {}) {
  const parsed = parseGoal(goal);
  const policy = createPolicy(parsed.policyId);
  const plan = createProductionPlan(parsed.goal);
  const loop = createLoopPlan(parsed.goal);
  const score = createScoreReport(parsed.goal);
  const issues = createIssueReport(parsed.goal);
  const blockers = detectBlockers(issues.issues);
  return {
    ok: true,
    version: VERSION,
    goal: parsed.goal,
    autopilotId: parsed.autopilotId,
    status: options.studioConnected ? 'codexOwnedAutopilotRunPlan' : 'manualRequired',
    manualRequired: !options.studioConnected,
    manualRequiredReason: options.studioConnected ? null : 'Studio/Play/Test evidence is unavailable; returning bounded run plan only.',
    policy,
    plan,
    loop,
    issues: issues.issues,
    score,
    stopDecision: evaluateStopConditions({ policy, roundIndex: 0, currentScore: score.finalScore, blockers: blockers.blockers }),
    createdPaths: options.studioConnected ? [`${ROOTS.replicatedStorage}.Runs.${parsed.autopilotId}`, `${ROOTS.workspace}.${parsed.autopilotId}`] : [],
    warnings: options.studioConnected ? [] : ['Run connect and collect evidence before claiming live execution.'],
    blockers: blockers.blockers,
    nextCommand: `tools\\bridge.cmd autopilot report "${parsed.goal}"`,
  };
}

module.exports = {
  CAPABILITIES,
  DEFAULT_POLICY,
  EVIDENCE_SOURCES,
  FIX_STAGES,
  INTEGRATIONS,
  PHASES,
  POLICY_IDS,
  ROOTS,
  SCORE_KEYS,
  SPECIALISTS,
  VERSION,
  createEvidencePack,
  createFinalReport,
  createFixPlan,
  createLoopPlan,
  createManifest,
  createPolicy,
  createPolishPlan,
  createProductionPlan,
  createRetestPlan,
  createRollbackPlan,
  createRoundPlan,
  createRunPlan,
  createSafeApplyPlan,
  createScoreReport,
  createStatus,
  createIssueReport,
  detectBlockers,
  evaluateStopConditions,
  listPolicies,
  manifestPath,
  parseGoal,
  routeSpecialists,
};
