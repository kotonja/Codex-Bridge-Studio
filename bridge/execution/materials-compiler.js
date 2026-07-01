'use strict';

const MaterialExecution = require('../materials/execution-bridge');
const { SYSTEMS, VERSION, safeGoal } = require('./schema');

function compileMaterials(goal, context = {}) {
  const compiled = MaterialExecution.compileForExecution(goal, context);
  return {
    ok: compiled.ok,
    version: compiled.version,
    executionKernelVersion: VERSION,
    goal: safeGoal(goal),
    system: SYSTEMS.materials,
    sourcePlan: 'materialRealization',
    actions: compiled.operations,
    operationCount: compiled.operations.length,
    manifest: compiled.manifest,
    materialPlan: {
      version: compiled.version,
      styleId: compiled.styleId,
      basePath: compiled.basePath,
      palette: compiled.palette,
      lighting: compiled.lighting,
      atmosphere: compiled.atmosphere,
      budget: compiled.budget,
      audit: compiled.audit,
      polishPlan: compiled.polishPlan,
    },
    manualRequired: compiled.manualRequired,
    manualRequiredActions: compiled.manualRequired,
    blockedActions: [],
    warnings: compiled.warnings,
    blockers: compiled.blockers,
    previewOnly: true,
  };
}

module.exports = {
  compileMaterials,
};
