'use strict';

const { clampScore } = require('./schema');

function arr(value) {
  return Array.isArray(value) ? value : [];
}

function scorePlayability(worldgen, reconstruction, qa) {
  const zones = arr(worldgen && worldgen.zones);
  const paths = arr(worldgen && worldgen.paths);
  const routeCount = arr(worldgen && worldgen.qaRoutes).length;
  const gameplaySpaces = reconstruction && reconstruction.gameplaySpaces && Array.isArray(reconstruction.gameplaySpaces.spaces)
    ? reconstruction.gameplaySpaces.spaces
    : [];
  const collisionZones = reconstruction && reconstruction.collisionZones && Array.isArray(reconstruction.collisionZones.zones)
    ? reconstruction.collisionZones.zones
    : [];
  const launchScore = qa && qa.launchReadiness ? Number(qa.launchReadiness.launchReadinessScore || qa.launchReadiness.score || 0) : 72;
  const subScores = {
    spawnClarity: zones.some((zone) => zone.role === 'spawn') ? 88 : 48,
    routeClarity: clampScore(50 + paths.length * 7),
    objectiveClarity: zones.some((zone) => /focal|portal|objective|reward/i.test(String(zone.role || zone.id))) ? 84 : 58,
    interactionCoverage: clampScore(54 + gameplaySpaces.length * 7 + routeCount * 2),
    collisionPlan: clampScore(55 + collisionZones.length * 7),
    mobileReadability: zones.every((zone) => zone.mobileFallback) ? 84 : 64,
    qaReadiness: clampScore(launchScore),
  };
  const values = Object.values(subScores);
  return {
    score: clampScore(values.reduce((sum, value) => sum + value, 0) / values.length),
    subScores,
  };
}

module.exports = { scorePlayability };
