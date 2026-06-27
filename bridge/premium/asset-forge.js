'use strict';

const { VERSION, ASSET_CLASSES, nowIso } = require('./schema');

function classifyAssets(brief, styleBible) {
  const goal = brief.goal.toLowerCase();
  const entries = [
    { role: 'primary blockout forms', class: 'robloxPrimitive', reason: 'Fast, editable, undo-friendly structure.' },
    { role: 'trim, rails, socket frames', class: 'generatedModel', reason: 'Generated detail should be versioned and consistent.' },
    { role: 'hero focal mesh', class: goal.includes('exact') || goal.includes('premium') ? 'meshNeeded' : 'generatedModel', reason: 'Reference-level silhouettes eventually need custom mesh or curated kit pieces.' },
    { role: 'surface accents and signs', class: 'decalNeeded', reason: 'Typography, icons, grime, and lab labels sell premium quality.' },
    { role: 'particle/detail atmosphere', class: 'vfxOnly', reason: 'VFX adds life without editing production systems.' },
    { role: 'HUD/portal prompt layer', class: 'uiOnly', reason: 'Readable calls to action need UI/sign coordination.' },
    { role: 'interaction stings and ambience', class: 'audioOnly', reason: 'Premium feel needs soft loop plus short feedback cues.' },
  ];
  return entries.map((item, index) => ({ id: `${item.class}_${index + 1}`, ...item }));
}

function createAssetForgePlan(brief, styleBible, options = {}) {
  const classifications = classifyAssets(brief, styleBible);
  return {
    version: VERSION,
    at: nowIso(),
    goal: brief.goal,
    assetClasses: ASSET_CLASSES,
    preferredSourceRoots: [
      options.assetRoot || "Workspace.PDS' Particles & Models Kit",
      'ReplicatedStorage',
      'Workspace',
      'StarterGui',
    ],
    classifications,
    kitbashRules: ['reuse local texture IDs when present', 'do not upload/buy assets automatically', 'copy only Codex-owned generated variants', 'store role maps in manifests'],
    missingAssetNeeds: classifications.filter((item) => ['meshNeeded', 'textureNeeded', 'decalNeeded', 'externalManualRequired'].includes(item.class)),
    generatedOutputRoots: [
      'Workspace.CodexBuildDirector',
      'ReplicatedStorage.CodexBuildDirector',
      'ReplicatedStorage.CodexVfxWorkbench',
      'ReplicatedStorage.CodexPremiumDirector',
    ],
    warnings: [],
    blockers: [],
    evidence: ['style bible material palette', 'goal compiler tags', 'local-first asset safety model'],
    nextCommand: `tools\\bridge.cmd premium world "${brief.goal}"`,
  };
}

module.exports = { createAssetForgePlan };
