'use strict';

function createGrammarPolicy(parsed, style, moduleGrid) {
  return {
    baseModuleSize: moduleGrid.baseModule,
    verticalModuleSize: moduleGrid.verticalModule,
    wallBayRules: style.wallRules,
    cornerRules: ['corner bay must be visually heavier than straight bay', 'corners get pillar or buttress anchors'],
    archProportions: { widthModules: 2, heightModules: 2.5, segmentCount: parsed.power === 'large' ? 9 : 7, keystoneScale: 1.15 },
    pillarSpacing: { everyBays: 1, maxGapStuds: moduleGrid.bayWidth + 2, cornerPriority: true },
    trimBands: style.trimRules,
    roofUpperSilhouette: style.roofRules,
    doorWindowRhythm: style.windowDoorRules,
    depthLayers: style.depthRules,
    socketAnchorRules: ['VFX sockets sit on focal accents', 'audio sockets attach to non-colliding markers', 'camera sockets frame the silhouette'],
    collisionClearance: { playerHeightStuds: 6, minWidthStuds: moduleGrid.clearance, keepPortalCenterClear: true },
    forbiddenCheapPatterns: style.forbiddenCheapPatterns,
    mobileBudgetHints: style.mobileBudgetHints,
  };
}

module.exports = { createGrammarPolicy };
