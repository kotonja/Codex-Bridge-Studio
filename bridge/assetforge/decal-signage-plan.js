'use strict';

function createDecalSignagePlan(goal, families = []) {
  return families
    .filter((family) => family.taxonomy.includes('decalNeeded'))
    .map((family) => ({
      assetId: family.id,
      decalNeed: 'manualRequired',
      signageRole: family.role,
      spec: `Create readable ${family.role} icon/decal for ${goal}; avoid tiny text and copyrighted logos.`,
      fallback: 'Use TextLabel/BillboardGui or simple colored icon plaque until decal asset exists.',
    }));
}

module.exports = { createDecalSignagePlan };
