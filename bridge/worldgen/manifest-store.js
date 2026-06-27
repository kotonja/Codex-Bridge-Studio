'use strict';

const { VERSION, ROOTS, nowIso, safeGoal, slugify } = require('./schema');
const { createLayoutGraph } = require('./layout-graph');
const { createBuildPlan } = require('./build-plan');
const { createAuditReport } = require('./audit-report');
const { createPerformanceBudget } = require('./density-budget');
const { createTraversalRoute } = require('./traversal-route');

function manifestPath(goal, root = ROOTS.manifests) {
  return `${root}.${slugify(goal, 'worldgen_manifest')}`;
}

function createManifest(goal, options = {}) {
  const cleanGoal = safeGoal(goal || options.goal || options.intent);
  const graph = options.graph || createLayoutGraph(cleanGoal, options);
  const buildPlan = options.buildPlan || createBuildPlan(cleanGoal, { ...options, graph });
  const audit = options.audit || createAuditReport(cleanGoal, { ...options, graph });
  const budget = options.budget || createPerformanceBudget(graph);
  const traversal = options.traversal || createTraversalRoute(cleanGoal, graph);
  const hash = graph.graphId.split('_').pop();
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: cleanGoal,
    graphId: graph.graphId,
    styleId: graph.styleId,
    scale: graph.scale,
    graph,
    buildPlan,
    audit,
    budget,
    traversal,
    manifestPath: manifestPath(cleanGoal),
    workspacePath: `${ROOTS.workspace}.Worldgen_${hash}`,
    premiumMirrorPath: `${ROOTS.premiumMirror}.${slugify(cleanGoal, 'worldgen')}`,
    createdPaths: options.createdPaths || [],
    attributes: {
      CodexGenerated: true,
      CodexSystem: 'Worldgen',
      CodexVersion: VERSION,
      CodexGoal: cleanGoal,
    },
    warnings: options.warnings || [],
    blockers: options.blockers || [],
    nextCommand: `tools\\bridge.cmd visual critique "${cleanGoal}"`,
  };
}

module.exports = { createManifest, manifestPath };
