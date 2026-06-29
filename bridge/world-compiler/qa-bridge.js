'use strict';

const QaSwarm = require('../qa-swarm');

function createQaBridge(goal, worldgen, assetForge, cinematic) {
  const launch = QaSwarm.createLaunchReadinessReport(goal);
  return {
    ok: true,
    version: QaSwarm.VERSION,
    goal,
    plan: QaSwarm.createQaPlan(goal),
    route: QaSwarm.createRouteTestPlan(goal),
    ui: QaSwarm.createUiTestPlan(goal),
    performance: QaSwarm.createPerformanceProbePlan(goal),
    accessibility: QaSwarm.createAccessibilityAuditPlan(goal),
    launchReadiness: launch,
    referenceFidelityChecks: [
      'spawn view matches focal hierarchy',
      'primary route preserves reference silhouette',
      'materials and asset families follow reference style language',
      'cinematic beats do not obscure playable route readability',
    ],
    worldgenRouteCount: worldgen && Array.isArray(worldgen.qaRoutes) ? worldgen.qaRoutes.length : 0,
    assetFamilyCount: assetForge && Array.isArray(assetForge.assetFamilies) ? assetForge.assetFamilies.length : 0,
    cinematicBeatCount: cinematic && cinematic.beats && Array.isArray(cinematic.beats.beats) ? cinematic.beats.beats.length : 0,
    warnings: launch.warnings || [],
    blockers: launch.blockers || [],
    nextCommand: `tools\\bridge.cmd worldcompile execute-preview "${goal.replace(/"/g, '\\"')}"`,
  };
}

module.exports = { createQaBridge };
