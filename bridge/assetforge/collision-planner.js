'use strict';

function createCollisionPlan(families = []) {
  return families.map((family) => ({
    familyId: family.id,
    proxyType: family.role.includes('path') || family.role.includes('ground') ? 'walkable slab' : 'simple bounding box',
    collisionDetail: 'low',
    canCollideVisuals: false,
    proxyName: `${family.id}_Collision_Proxy`,
    validationCheck: `No tiny decorative parts should carry player collision for ${family.id}.`,
  }));
}

module.exports = { createCollisionPlan };
