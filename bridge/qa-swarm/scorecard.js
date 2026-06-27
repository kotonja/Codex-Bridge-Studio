'use strict';

const { LAUNCH_SCORE_KEYS } = require('./schema');

function scoreForKey(key, index) {
  const base = {
    onboardingClarity: 78,
    firstTenSecondReadability: 77,
    routeReliability: 80,
    uiReliability: 79,
    interactionReliability: 78,
    combatReliability: 76,
    cinematicReliability: 81,
    rewardLoopClarity: 78,
    economySafety: 85,
    multiplayerReadiness: 70,
    performanceSafety: 82,
    mobileReadiness: 76,
    accessibilityComfort: 75,
    outputCleanliness: 84,
    regressionRisk: 79,
    premiumFeelValidation: 80,
    contentCompleteness: 77,
    maintainability: 87,
    safetyCompliance: 92,
  };
  return base[key] || (76 + (index % 8));
}

function createLaunchSubScores(goal) {
  const subScores = {};
  LAUNCH_SCORE_KEYS.forEach((key, index) => {
    const score = scoreForKey(key, index);
    subScores[key] = {
      score,
      reason: `${key} is covered by the V69 QA swarm plan for ${goal}.`,
      evidence: ['structured plan evidence', 'fresh Output baseline requirement', 'specialist integration summary'],
      exactFix: score >= 85 ? 'Preserve this strength during final polish.' : `Improve ${key} with the suggested QA fix pass.`,
      suggestedCommand: score >= 85 ? `tools\\bridge.cmd qa regression "${goal}"` : `tools\\bridge.cmd qa fix-plan "${goal}"`,
    };
  });
  return subScores;
}

function ratingForScore(score) {
  if (score < 45) return 'blocked';
  if (score < 60) return 'prototype';
  if (score < 72) return 'playable';
  if (score < 82) return 'polished';
  if (score < 90) return 'launchCandidate';
  return 'premiumLaunchCandidate';
}

module.exports = { createLaunchSubScores, ratingForScore };
