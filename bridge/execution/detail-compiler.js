'use strict';

const DetailExecution = require('../detail/execution-bridge');
const { SYSTEMS, VERSION, safeGoal } = require('./schema');

function compileDetail(goal, context = {}) {
  const compiled = DetailExecution.compileForExecution(goal, context);
  return {
    ok: compiled.ok,
    version: compiled.version,
    executionKernelVersion: VERSION,
    goal: safeGoal(goal),
    system: SYSTEMS.detail,
    sourcePlan: 'detailCompiler',
    actions: compiled.operations,
    operationCount: compiled.operations.length,
    manifest: compiled.manifest,
    detailCompilePlan: {
      version: compiled.version,
      styleId: compiled.styleId,
      basePath: compiled.basePath,
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

module.exports = {
  compileDetail,
};
