'use strict';

function createProductionHints(ctx) {
  const goal = ctx.clean.replace(/"/g, '\\"');
  return {
    premium: [`tools\\bridge.cmd premium plan "${goal}"`, 'Use the style profile as the premium style bible seed.'],
    worldgen: [`tools\\bridge.cmd worldgen graph "${goal}"`, 'Turn layout hypotheses into zones, paths, vistas, and QA routes.'],
    assetforge: [`tools\\bridge.cmd assetforge kit "${goal}"`, 'Generate reusable trims, landmark pieces, signs, pads, and prop taxonomy.'],
    visual: [`tools\\bridge.cmd visual critique "${goal}"`, 'Check focal hierarchy, lighting, mobile readability, and cheap-pattern risks.'],
    cinematic: [`tools\\bridge.cmd cinematic plan "${goal}"`, 'Use camera language and mood cues for spawn reveal or portal activation moments.'],
    qa: [`tools\\bridge.cmd qa launch "${goal}"`, 'Verify onboarding, mobile readability, path clarity, and performance risk.'],
    execution: [`tools\\bridge.cmd execute preview "${goal}"`, 'Reference Lab is read-only; actual Studio changes must go through V72 preview/apply/verify/rollback.'],
    memory: [`tools\\bridge.cmd reference remember "${goal}"`, 'Store redacted reference profile so premium/worldgen/assetforge can reuse it.'],
    nextPipeline: [
      `tools\\bridge.cmd reference remember "${goal}"`,
      `tools\\bridge.cmd premium plan "${goal}"`,
      `tools\\bridge.cmd worldgen graph "${goal}"`,
      `tools\\bridge.cmd assetforge kit "${goal}"`,
      `tools\\bridge.cmd execute preview "${goal}"`,
    ],
  };
}

module.exports = {
  createProductionHints,
};
