'use strict';

const { VERSION, nowIso, safeGoal, slugify } = require('./schema');

function createManifest(goal, compiled) {
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    name: `${slugify(goal, 'architecture')}_ArchitectureManifest`,
    goal: safeGoal(goal),
    architectureId: compiled.architectureId,
    styleId: compiled.styleId,
    basePath: compiled.basePath,
    moduleGrid: compiled.moduleGrid,
    systems: compiled.systems,
    operationCount: (compiled.operations || []).length,
    variants: compiled.variants,
    budget: compiled.budget,
    audit: compiled.audit,
    manualRequired: compiled.manualRequired,
    warnings: compiled.warnings,
    blockers: compiled.blockers,
    nextCommand: `tools\\bridge.cmd architecture execute-preview "${safeGoal(goal)}"`,
  };
}

module.exports = { createManifest };
