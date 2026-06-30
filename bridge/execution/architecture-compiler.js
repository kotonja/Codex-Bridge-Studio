'use strict';

const Architecture = require('../architecture');
const { SYSTEMS, VERSION, safeGoal } = require('./schema');

function compileArchitecture(goal, context = {}) {
  const compiled = Architecture.compileForExecution(goal, context);
  return {
    ok: compiled.ok,
    version: compiled.version,
    executionKernelVersion: VERSION,
    goal: safeGoal(goal),
    system: SYSTEMS.architecture,
    sourcePlan: 'architectureCompiler',
    actions: compiled.operations,
    operationCount: compiled.operations.length,
    manifest: compiled.manifest,
    architectureCompilePlan: {
      version: compiled.version,
      architectureId: compiled.architectureId,
      styleId: compiled.styleId,
      basePath: compiled.basePath,
      moduleGrid: compiled.moduleGrid,
      systems: compiled.systems,
      operationCount: compiled.operations.length,
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

module.exports = { compileArchitecture };
