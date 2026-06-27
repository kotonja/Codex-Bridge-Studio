'use strict';

const { VERSION, BUILD_PHASES, nowIso, safeGoal } = require('./schema');
const { createLayoutGraph } = require('./layout-graph');

function createBuildPlan(goal, options = {}) {
  const graph = options.graph || createLayoutGraph(goal, options);
  const cleanGoal = safeGoal(goal || graph.goal);
  const phases = BUILD_PHASES.map((phase, index) => ({
    index: index + 1,
    phase,
    targetZones: index < 3 ? ['spawn', 'primary_focal', 'portal_nexus'] : graph.zones.slice(0, 6).map((zone) => zone.id),
    expectedCreatedPaths: [
      `Workspace.CodexWorldgen.${graph.graphId}.${String(index + 1).padStart(2, '0')}_${phase.replace(/[^A-Za-z0-9]+/g, '_')}`,
      `ReplicatedStorage.CodexWorldgen.${graph.graphId}.Phase_${String(index + 1).padStart(2, '0')}`,
    ],
    command: index === 12 ? `tools\\bridge.cmd visual critique "${cleanGoal}"` : `tools\\bridge.cmd worldgen generate "${cleanGoal}"`,
    safetyClassification: index === 12 ? 'readOnlyVisualCritique' : 'fullTrustCodexOwnedWorldgen',
    expectedQualityImprovement: `Improves ${phase} while preserving readable player flow.`,
    validationCheck: index === 11 ? `tools\\bridge.cmd worldgen route "${cleanGoal}"` : `tools\\bridge.cmd worldgen audit "${cleanGoal}"`,
  }));
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: cleanGoal,
    graphId: graph.graphId,
    phases,
    createdRoot: `Workspace.CodexWorldgen.${graph.graphId}`,
    manifestRoot: `ReplicatedStorage.CodexWorldgen.${graph.graphId}`,
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd worldgen generate "${cleanGoal}"`,
  };
}

module.exports = { createBuildPlan };
