'use strict';

const { VERSION, POLISH_STAGES, nowIso, safeGoal } = require('./schema');

const ACTIONS = {
  'composition pass': ['Workspace / camera bookmarks', 'Establish a dominant hero read and cleaner spawn framing.', 'stronger first impression and easier screenshot read', 'tools\\bridge.cmd camera director'],
  'lighting pass': ['Lighting and focal accents', 'Create depth and premium contrast without washing the scene.', 'clearer foreground/midground/background separation', 'tools\\bridge.cmd build materials "premium lighting palette"'],
  'material pass': ['Generated/curated surfaces', 'Replace default-looking surfaces with a disciplined material stack.', 'less cheap/default Roblox look', 'tools\\bridge.cmd build polish <modelPath>'],
  'silhouette pass': ['Hero landmarks and portals', 'Improve big-shape readability before tiny detail.', 'cleaner shapes visible from spawn and mobile', 'tools\\bridge.cmd visual evidence'],
  'VFX integration pass': ['VFX sockets and focal effects', 'Tie effects to objectives and reduce noisy overdraw.', 'more premium reward energy without clutter', 'tools\\bridge.cmd vfx audit <preset-or-path>'],
  'UI readability pass': ['HUD and world labels', 'Keep UI from hiding the focal point and verify scale.', 'better gameplay readability on desktop and phone', 'tools\\bridge.cmd ui deep'],
  'clutter reduction pass': ['Low-value props/noise', 'Remove or group decoration that fights the main read.', 'cleaner scene hierarchy and less visual noise', 'tools\\bridge.cmd build audit <modelPath>'],
  'mobile fallback pass': ['Phone/tablet viewports', 'Confirm path, labels, and VFX remain readable on small screens.', 'fewer mobile readability regressions', 'tools\\bridge.cmd device verify phone-portrait'],
  'final screenshot pass': ['Camera/screen evidence', 'Collect after-polish proof for before/after comparison.', 'objective evidence of improvement', 'tools\\bridge.cmd visual critique "<goal>"'],
};

function createVisualPolishPlan(goal, critique = {}) {
  const cleanGoal = safeGoal(goal);
  const actions = POLISH_STAGES.map((stage, index) => {
    const [target, reason, expected, commandTemplate] = ACTIONS[stage];
    return {
      order: index + 1,
      stage,
      target,
      reason,
      expectedVisualImprovement: expected,
      command: commandTemplate.replace('<goal>', cleanGoal),
      safetyClassification: index === POLISH_STAGES.length - 1 || stage === 'silhouette pass' ? 'readOnly' : 'codexOwnedMutation',
      actionKind: index === POLISH_STAGES.length - 1 || stage === 'silhouette pass' ? 'readOnly' : 'codexOwnedMutation',
    };
  });
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: cleanGoal,
    stages: actions,
    actions,
    basedOnScore: critique.overallScore ?? critique.score ?? null,
    warnings: critique.warnings || [],
    blockers: critique.blockers || [],
    nextCommand: `tools\\bridge.cmd visual evidence`,
  };
}

module.exports = { createVisualPolishPlan };
