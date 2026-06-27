'use strict';

const { VERSION, ROOTS, safeGoal, nowIso } = require('./schema');
const { compileGoal } = require('./goal-compiler');
const { createStyleBible } = require('./style-bible');
const { createAssetForgePlan } = require('./asset-forge');
const { createWorldGrammarPlan } = require('./world-grammar');
const { createBuildRoundPlan } = require('./build-round');
const { createVisualCritiquePlan } = require('./visual-critique');
const { createPerformanceBudget } = require('./performance-budget');
const { createQaPlan } = require('./qa-plan');
const { scoreFromManifest } = require('./quality-score');
const { buildManifest, manifestPath } = require('./manifest-store');
const { createDirectorReport } = require('./director-report');

function productionBrief(goal, options = {}) {
  const brief = compileGoal(safeGoal(goal || options.goal || options.intent), options);
  return {
    version: VERSION,
    at: nowIso(),
    ...brief,
    productionGoal: brief.goal,
    successDefinition: 'A readable, screenshot-ready, mobile-safe Roblox slice with clear focal hierarchy, specialist manifests, QA plan, and exact next polish command.',
    constraints: ['local-first', 'Codex-owned generated outputs by default', 'no account-level action without manualRequired', 'specialists reused instead of duplicated'],
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd premium style "${brief.goal}"`,
  };
}

function createPremiumManifest(goal, options = {}) {
  const brief = productionBrief(goal, options);
  const styleBible = createStyleBible(brief);
  const assetForgePlan = createAssetForgePlan(brief, styleBible, options);
  const worldGrammarPlan = createWorldGrammarPlan(brief, styleBible);
  const buildRoundPlan = createBuildRoundPlan(brief, styleBible, assetForgePlan, worldGrammarPlan);
  const visualCritiquePlan = createVisualCritiquePlan(brief, styleBible, worldGrammarPlan);
  const performanceBudget = createPerformanceBudget(brief);
  const qaPlan = createQaPlan(brief, worldGrammarPlan);
  const partial = buildManifest({
    goal: brief.goal,
    productionBrief: brief,
    styleBible,
    assetForgePlan,
    worldGrammarPlan,
    buildRoundPlan,
    visualCritiquePlan,
    performanceBudget,
    qaPlan,
    createdPaths: [],
  });
  partial.qualityScore = scoreFromManifest(partial);
  partial.manifestPath = manifestPath(brief.goal);
  partial.nextCommand = `tools\\bridge.cmd premium build "${brief.goal}"`;
  return partial;
}

function getStatus(lastManifest = null) {
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    status: 'ready',
    roots: ROOTS,
    capabilities: ['production brief', 'style bible', 'asset forge', 'world grammar', 'specialist build routing', 'visual critique', 'performance budget', 'QA plan', 'quality score'],
    nextCommand: 'tools\\bridge.cmd premium plan "premium anime boss lobby"',
    lastManifest,
  };
}

module.exports = {
  VERSION,
  ROOTS,
  productionBrief,
  createStyleBible,
  createAssetForgePlan,
  createWorldGrammarPlan,
  createBuildRoundPlan,
  createVisualCritiquePlan,
  createPerformanceBudget,
  createQaPlan,
  scoreFromManifest,
  createPremiumManifest,
  manifestPath,
  getStatus,
  createDirectorReport,
};
