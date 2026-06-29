'use strict';

function createVariants(ctx) {
  const cleanGoal = ctx.goal.replace(/"/g, '\\"');
  return [
    {
      id: 'faithfulReference',
      description: 'Preserve the visible hero angle and make the unseen structure a conservative shell behind it.',
      tradeoffs: ['highest visual faithfulness', 'least ambitious interior gameplay', 'rear side remains mostly blocked/decorative'],
      confidence: 0.62,
      worldgenHints: ['front-facing spawn reveal', 'single-axis route', 'decorative back blockers'],
      assetforgeHints: ['facade modules', 'side-wall repeats', 'roof cap trims'],
      executionPreviewCommand: `tools\\bridge.cmd execute preview "faithful reconstruction for ${cleanGoal}"`,
    },
    {
      id: 'gameplayFirst',
      description: 'Use the reference as facade language, then expand the interior into clear shop/quest/portal/reward gameplay rooms.',
      tradeoffs: ['best gameplay clarity', 'may deviate from exact unseen reference', 'requires more modular assets'],
      confidence: 0.58,
      worldgenHints: ['hub room graph', 'side-branch services', 'return-loop reward alcove'],
      assetforgeHints: ['door/window kit', 'room prop kit', 'portal activation kit'],
      executionPreviewCommand: `tools\\bridge.cmd execute preview "gameplay reconstruction for ${cleanGoal}"`,
    },
    {
      id: 'mobileOptimized',
      description: 'Reduce interior complexity, widen routes, and keep VFX/decor away from the main path.',
      tradeoffs: ['best low-end/mobile readability', 'less dense premium detail', 'fewer hidden routes'],
      confidence: 0.66,
      worldgenHints: ['wide main route', 'limited branches', 'strong objective markers'],
      assetforgeHints: ['low-overdraw trims', 'large readable signage', 'simple collision proxies'],
      executionPreviewCommand: `tools\\bridge.cmd execute preview "mobile optimized reconstruction for ${cleanGoal}"`,
    },
  ];
}

module.exports = {
  createVariants,
};

