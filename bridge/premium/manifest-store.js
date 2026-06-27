'use strict';

const { VERSION, ROOTS, slugify, nowIso, hasExternalRisk } = require('./schema');

function buildManifest(parts) {
  const goal = parts.goal;
  const manifest = {
    version: VERSION,
    at: nowIso(),
    goal,
    productionBrief: parts.productionBrief,
    styleBible: parts.styleBible,
    assetForgePlan: parts.assetForgePlan,
    assetForgeProPlan: parts.assetForgeProPlan,
    assetForgeKitPlan: parts.assetForgeKitPlan,
    assetForgeAudit: parts.assetForgeAudit,
    worldGrammarPlan: parts.worldGrammarPlan,
    worldgenPlan: parts.worldgenPlan,
    worldgenLayoutGraph: parts.worldgenLayoutGraph,
    worldgenBuildPlan: parts.worldgenBuildPlan,
    worldgenAudit: parts.worldgenAudit,
    buildRoundPlan: parts.buildRoundPlan,
    visualCritiquePlan: parts.visualCritiquePlan,
    visualEvidencePack: parts.visualEvidencePack,
    visualCritiqueReport: parts.visualCritiqueReport,
    visualPolishPlan: parts.visualPolishPlan,
    performanceBudget: parts.performanceBudget,
    qaPlan: parts.qaPlan,
    qualityScore: parts.qualityScore,
    createdPaths: parts.createdPaths || [],
    warnings: [...(parts.warnings || [])],
    blockers: [...(parts.blockers || [])],
    nextCommand: `tools\\bridge.cmd premium polish "${goal}"`,
  };
  const risks = hasExternalRisk({
    goal: manifest.goal,
    productionGoal: manifest.productionBrief && manifest.productionBrief.productionGoal,
  });
  if (risks.length) {
    manifest.warnings.push(`Manual review required for external-risk terms: ${risks.join(', ')}`);
  }
  return manifest;
}

function manifestPath(goal, root = ROOTS.manifests) {
  return `${root}.${slugify(goal, 'premium_manifest')}`;
}

module.exports = { buildManifest, manifestPath };
