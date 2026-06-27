'use strict';

const { VERSION, nowIso } = require('./schema');

function createPerformanceBudget(brief) {
  const large = brief.scale === 'large';
  return {
    version: VERSION,
    at: nowIso(),
    goal: brief.goal,
    targetTier: large ? 'mobileBalancedScene' : 'mobileSafeSlice',
    budgets: {
      generatedParts: large ? 450 : 180,
      visibleNeonParts: large ? 80 : 30,
      activeEmitters: large ? 35 : 14,
      emitterRateTotal: large ? 450 : 160,
      lights: large ? 16 : 6,
      transparentHeroLayers: 3,
      scriptsAddedToProduction: 0,
    },
    priorities: ['readable silhouettes over raw density', 'visible path clarity before decoration', 'particle rate caps before screenshot polish', 'no production script edits from premium director'],
    warnings: [],
    blockers: [],
    evidence: ['scale classifier', 'mobile-safe budget defaults'],
    nextCommand: `tools\\bridge.cmd premium score <manifestPath>`,
  };
}

module.exports = { createPerformanceBudget };
