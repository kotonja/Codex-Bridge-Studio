'use strict';

const { VERSION, nowIso } = require('./schema');

function createVisualCritiquePlan(brief, styleBible, worldGrammarPlan) {
  return {
    version: VERSION,
    at: nowIso(),
    goal: brief.goal,
    reviewPasses: [
      { id: 'silhouette', question: 'Can the hero focal, paths, and portals be understood from spawn?', evidence: 'camera director + tree/audit' },
      { id: 'material', question: 'Are materials disciplined, or is the scene noisy/default-gray?', evidence: 'build audit material counts' },
      { id: 'lighting', question: 'Does lighting create foreground/midground/background depth?', evidence: 'camera screenshot/fallback report' },
      { id: 'vfx', question: 'Do VFX support focal hierarchy without overdraw?', evidence: 'vfx audit + budget' },
      { id: 'mobile', question: 'Are labels, paths, and taps readable on phone?', evidence: 'device verify + ui audit' },
    ],
    cheapLookTriggers: styleBible.forbiddenCheapLookingPatterns,
    evidenceToCollect: ['camera director', 'build audit', 'vfx audit', 'audio audit', 'test snapshot', 'watch errors'],
    repairHeuristics: ['increase focal contrast before adding more parts', 'add trims to large flat surfaces', 'replace random neon with intentional accent sockets', 'defer custom mesh requests into assetForgePlan'],
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd premium qa "${brief.goal}"`,
  };
}

module.exports = { createVisualCritiquePlan };
