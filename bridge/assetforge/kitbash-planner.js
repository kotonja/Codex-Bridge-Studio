'use strict';

function createKitbashPlan(goal, families = []) {
  return {
    ok: true,
    goal,
    kitbashGroups: families.filter((family) => family.taxonomy.includes('kitbashModel')).map((family) => ({
      familyId: family.id,
      sourcePolicy: 'reuse existing local/Codex-owned pieces only; no marketplace auto-download',
      composition: ['hero core', 'trim/rim modules', 'socket plates', 'collision proxy'],
      snapRules: ['pivot at floor center', 'grid-friendly 4 stud increments', 'consistent forward axis'],
    })),
    warnings: [],
    blockers: [],
  };
}

module.exports = { createKitbashPlan };
