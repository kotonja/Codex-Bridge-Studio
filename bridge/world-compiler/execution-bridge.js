'use strict';

const Execution = require('../execution');

function createExecutionPreviewBridge(goal, packageSummary = {}) {
  const preview = Execution.preview(goal, {
    source: 'worldCompiler.executionPreview',
    system: 'worldcompile',
    packageId: packageSummary.packageId,
  });
  return {
    ok: true,
    version: Execution.VERSION,
    goal: preview.goal || goal,
    previewOnly: true,
    mutatesStudioDirectly: false,
    requiresExplicitApply: true,
    executionRequiresV72: true,
    preview,
    acceptedRoots: preview.acceptedRoots || Execution.ROOTS,
    nextCommand: `tools\\bridge.cmd execute preview "${String(goal).replace(/"/g, '\\"')}"`,
    warnings: preview.warnings || [],
    blockers: preview.blockers || [],
  };
}

module.exports = { createExecutionPreviewBridge };
