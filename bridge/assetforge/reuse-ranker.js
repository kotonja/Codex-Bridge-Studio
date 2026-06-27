'use strict';

function rankReuse(families = []) {
  return families.map((family) => ({
    familyId: family.id,
    reuseScore: Math.max(55, 96 - family.priority * 9),
    recommendedReuse: family.reuseCountExpected,
    reason: 'Higher priority families get fewer, more carefully placed hero variants; trim/prop families repeat more often.',
  }));
}

module.exports = { rankReuse };
