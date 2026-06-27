'use strict';

const { KIT_SECTIONS } = require('./schema');
const { classifyAssetFamily } = require('./asset-taxonomy');
const { createSocketPlan } = require('./socket-planner');

const ROLE_BY_SECTION = {
  focalLandmarks: 'landmark',
  secondaryLandmarks: 'landmark',
  pathTrim: 'trim',
  groundTiles: 'terrain',
  wallModules: 'terrain',
  shopModules: 'shop',
  questModules: 'quest',
  portalModules: 'portal',
  rewardModules: 'reward',
  propsSmall: 'prop',
  propsMedium: 'prop',
  signage: 'signage',
  lightingFixtures: 'decor',
  vfxSockets: 'fxEmitter',
  audioSockets: 'decor',
  collisionProxies: 'collision',
  mobileFallbacks: 'decor',
};

function createAssetFamilies(parsed, style) {
  return KIT_SECTIONS.map((section, index) => {
    const priority = index < 4 ? 1 : index < 10 ? 2 : 3;
    const id = `${section}_${parsed.assetKitId}`;
    const role = ROLE_BY_SECTION[section] || 'decor';
    const taxonomy = classifyAssetFamily(section, parsed);
    const sockets = createSocketPlan(parsed.goal, { familyId: id }).sockets.slice(0, priority === 1 ? 6 : 3);
    return {
      id,
      role,
      section,
      priority,
      taxonomy,
      variants: [`${section}_hero`, `${section}_standard`, `${section}_mobile`],
      qualityTarget: 'premium',
      reuseCountExpected: priority === 1 ? 2 : 5,
      worldgenZones: role === 'portal' ? ['portal_nexus'] : role === 'shop' ? ['shop'] : role === 'quest' ? ['quest'] : ['spawn', 'primary_focal', 'transition'],
      visualRules: [...style.silhouetteRules, ...style.trimLanguage.slice(0, 2)],
      sockets,
      budget: { maxParts: priority === 1 ? 90 : 38, maxLights: role === 'portal' ? 2 : 1, maxEmitters: role === 'fxEmitter' ? 4 : 1 },
      manualRequired: taxonomy.includes('manualExternalRequired'),
    };
  });
}

function createKitPlan(parsed, style) {
  const families = createAssetFamilies(parsed, style);
  const sections = {};
  for (const section of KIT_SECTIONS) {
    const family = families.find((item) => item.section === section);
    sections[section] = {
      assets: family ? [family] : [],
      variantCount: family ? family.variants.length : 0,
      reuseRules: [`Reuse ${section} by color/material variant, not by random copies.`, 'Keep naming stable for Worldgen placement.'],
      placementRules: [`Place ${section} only in matching Worldgen zones and keep path readability clear.`],
      budgetRules: family ? family.budget : {},
      styleNotes: style.visualPillars,
      command: family && family.manualRequired ? null : `tools\\bridge.cmd assetforge generate "${parsed.goal}"`,
      manualRequiredSpec: family && family.manualRequired ? `External mesh/texture authoring may improve ${family.id}; use mesh-plan/material-plan specs first.` : null,
    };
  }
  return {
    ok: true,
    version: parsed.version,
    goal: parsed.goal,
    styleId: parsed.styleId,
    assetKitId: parsed.assetKitId,
    assetFamilies: families,
    sections,
    requiredManifests: ['AssetForgeManifest', 'KitPlan', 'MaterialPlan', 'SocketPlan', 'BudgetReport'],
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd assetforge generate "${parsed.goal}"`,
  };
}

module.exports = { KIT_SECTIONS, createAssetFamilies, createKitPlan };
