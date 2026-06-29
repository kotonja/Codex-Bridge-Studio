'use strict';

const { quote } = require('./schema');

const STAGES = [
  ['focalHierarchy', 'focal hierarchy fixes'],
  ['silhouetteShape', 'silhouette/shape fixes'],
  ['materialColor', 'material/color fixes'],
  ['lightingMood', 'lighting/mood fixes'],
  ['objectCoverage', 'object coverage fixes'],
  ['layoutPathReadability', 'layout/path readability fixes'],
  ['gameplayAdaptationChecks', 'gameplay adaptation checks'],
  ['visualCritiqueRerun', 'visual critique rerun'],
  ['qaRerun', 'QA rerun'],
];

function action(stageId, label, goal, issueIds = []) {
  const commandMap = {
    focalHierarchy: `tools\\bridge.cmd execute safe-fix ${quote(`${goal} focal hierarchy markers`)}`,
    silhouetteShape: `tools\\bridge.cmd execute safe-fix ${quote(`${goal} silhouette and shape language markers`)}`,
    materialColor: `tools\\bridge.cmd execute safe-fix ${quote(`${goal} material and color fidelity notes`)}`,
    lightingMood: `tools\\bridge.cmd execute safe-fix ${quote(`${goal} lighting mood sockets`)}`,
    objectCoverage: `tools\\bridge.cmd execute safe-fix ${quote(`${goal} object coverage placeholders`)}`,
    layoutPathReadability: `tools\\bridge.cmd execute safe-fix ${quote(`${goal} layout path readability markers`)}`,
    gameplayAdaptationChecks: `tools\\bridge.cmd fidelity compare ${quote(goal)}`,
    visualCritiqueRerun: `tools\\bridge.cmd visual critique ${quote(goal)}`,
    qaRerun: `tools\\bridge.cmd qa launch ${quote(goal)}`,
  };
  return {
    stageId,
    label,
    issueIds,
    command: commandMap[stageId],
    safety: stageId.includes('Rerun') || stageId === 'gameplayAdaptationChecks' ? 'readOnlyValidation' : 'requiresV72ExecutionKernel',
    executionRequired: !(stageId.includes('Rerun') || stageId === 'gameplayAdaptationChecks'),
    manualRequired: false,
    expectedFidelityGain: stageId.includes('Rerun') || stageId === 'gameplayAdaptationChecks' ? 0 : 4,
    validationCommand: stageId === 'qaRerun' ? `tools\\bridge.cmd qa launch ${quote(goal)}` : `tools\\bridge.cmd fidelity score ${quote(goal)}`,
  };
}

function createFixPlan(goal, mismatches = []) {
  const byCategory = (category) => mismatches.filter((item) => item.category === category).map((item) => item.id);
  return {
    status: 'planOnly',
    mutatesStudioDirectly: false,
    requiresExecutionKernelForApply: true,
    stages: STAGES.map(([stageId, label]) => action(stageId, label, goal, {
      focalHierarchy: byCategory('layout').concat(byCategory('shape')),
      silhouetteShape: byCategory('shape'),
      materialColor: byCategory('material').concat(byCategory('style')),
      lightingMood: byCategory('lighting'),
      objectCoverage: byCategory('object'),
      layoutPathReadability: byCategory('layout'),
      gameplayAdaptationChecks: byCategory('gameplay'),
      visualCritiqueRerun: mismatches.map((item) => item.id),
      qaRerun: mismatches.map((item) => item.id),
    }[stageId] || [])),
  };
}

module.exports = {
  STAGES,
  createFixPlan,
};
