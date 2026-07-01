'use strict';

const { safeGoal, slugify, stableId } = require('./schema');

function parseGoal(input, options = {}) {
  const goal = safeGoal(input && typeof input === 'object'
    ? (input.goal || input.intent || input.query || input.text || input.path)
    : input);
  return {
    goal,
    polishId: stableId('polish', goal),
    slug: slugify(goal),
    source: options.source || 'polish.goal-parser',
    targetRoot: 'Workspace.CodexAutopilot',
    executionGoal: `${goal} polish pass`,
  };
}

module.exports = { parseGoal };
