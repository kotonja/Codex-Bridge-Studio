'use strict';

const { SHOT_IDS } = require('./schema');

const SHOT_PURPOSES = {
  spawn_default: ['first impression from player spawn', 'player-eye'],
  primary_focal_point: ['hero focal readability and premium landmark strength', 'cinematic-three-quarter'],
  gameplay_route: ['path clarity from spawn to main objective', 'route-follow'],
  shop_or_upgrade_area: ['shop/upgrade affordance, signage, and interaction clarity', 'mid-shot'],
  portal_or_objective_area: ['objective/portal readability and reward promise', 'hero-framed'],
  top_down_layout: ['macro composition, spacing, and zone balance', 'top-down'],
  mobile_readability: ['phone framing, label/tap readability, and safe-area risk', 'mobile-safe'],
  clutter_check: ['noise, overlap, prop density, and cheap-looking randomness', 'wide-audit'],
  lighting_depth: ['foreground/midground/background separation and depth', 'lighting-proof'],
  ui_overlay: ['HUD and world composition together', 'screen-composition'],
};

function createShotPlan(goal, options = {}) {
  const available = options.available !== false;
  return SHOT_IDS.map((id) => {
    const [purpose, cameraIntent] = SHOT_PURPOSES[id] || [id, 'structured'];
    return {
      id,
      purpose,
      cameraIntent,
      evidenceType: options.actualPixels ? 'pixelCapture' : (options.evidenceType || 'cameraReport'),
      available,
      notes: available ? [] : ['Studio is not connected; shot is planned but not captured.'],
    };
  });
}

module.exports = { createShotPlan, SHOT_PURPOSES };
