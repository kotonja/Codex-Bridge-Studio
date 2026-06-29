'use strict';

const { inferenceItem } = require('./schema');

function createCollisionPlan(ctx) {
  const evidence = ctx.sourceEvidence;
  const zones = [
    { id: 'main_wall_collision', type: 'walls', target: 'front_facade_shell and side_wall_pair', behavior: 'solid', confidence: 0.78 },
    { id: 'railing_collision', type: 'railings', target: 'stairs/balcony edges if verticality is used', behavior: 'solid waist-height barriers', confidence: 0.58 },
    { id: 'decor_blockers', type: 'blocked decorations', target: 'trim, roof caps, pipes, portal frame detail', behavior: 'blocked or non-interactive', confidence: 0.7 },
    { id: 'vfx_no_collision', type: 'no-collision VFX/decor', target: 'portal core, particles, glow rings, banners', behavior: 'CanCollide=false; do not block mobile path.', confidence: 0.77 },
    { id: 'simple_collision_proxies', type: 'collision proxies', target: 'complex decorative meshes or grouped trims', behavior: 'low-part proxy boxes around visual-only detail', confidence: 0.67 },
    { id: 'path_clearance_main', type: 'path clearances', target: 'spawn_to_entry and entry_to_primary_goal routes', behavior: '14-18 stud clear path, 9 stud minimum doorway.', confidence: 0.72 },
  ];
  return {
    zones,
    inferences: [
      inferenceItem('collision.decor_blockers', 'Decorative shell should be blocked or non-colliding by role.', 'Premium visual detail often creates snag points; collision proxies keep movement smooth.', 0.7, {
        sourceEvidence: evidence,
        alternatives: ['simple invisible wall volume', 'no-collision visual trim with physical wall behind it'],
      }),
      inferenceItem('collision.portal_core', 'Portal core should be visual-only with an explicit activation pad.', 'Players need a clear interactable target instead of guessing whether to walk into a glowing mesh.', 0.68, {
        sourceEvidence: evidence,
        alternatives: ['walk-through teleporter volume', 'ProximityPrompt activation stand'],
      }),
    ],
    mobileMinimums: {
      mainPathWidthStuds: 14,
      branchWidthStuds: 9,
      doorWidthStuds: 9,
      stairWidthStuds: 10,
    },
  };
}

module.exports = {
  createCollisionPlan,
};

