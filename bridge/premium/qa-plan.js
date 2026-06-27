'use strict';

const { VERSION, nowIso } = require('./schema');

function createQaPlan(brief, worldGrammarPlan) {
  return {
    version: VERSION,
    at: nowIso(),
    goal: brief.goal,
    recipe: 'premium-slice-qa',
    checks: [
      'spawn view shows objective and next action',
      'main path is traversable and not blocked',
      'portal/shop/quest labels are readable',
      'VFX does not hide gameplay markers',
      'fresh Output has no actionable errors',
      'mobile readability budget is respected',
      'audio/VFX/animation cue placeholders exist when relevant',
    ],
    commands: [
      'tools\\bridge.cmd baseline mark',
      'tools\\bridge.cmd camera director',
      'tools\\bridge.cmd build audit <modelPath>',
      'tools\\bridge.cmd vfx audit <presetPath>',
      'tools\\bridge.cmd test snapshot',
      'tools\\bridge.cmd watch errors',
    ],
    passDefinition: 'No blockers, clear spawn/focal path, bounded performance risk, and exact next polish action.',
    warnings: [],
    blockers: [],
    evidence: ['world grammar camera beats', 'performance budget', 'fresh output contract'],
    nextCommand: `tools\\bridge.cmd premium polish "${brief.goal}"`,
  };
}

module.exports = { createQaPlan };
