'use strict';

const { nowIso, safeGoal } = require('./schema');

function createMaterialApplyPlan(goal, palette, lighting, atmosphere, options = {}) {
  return {
    ok: true,
    version: options.version,
    at: nowIso(),
    goal: safeGoal(goal),
    targetPolicy: {
      codexOwnedOnly: true,
      nonCodexObjects: 'manualRequired',
      globalLighting: 'manualRequiredByDefault',
      pbrAssets: 'manualRequiredUnlessRealAssetIdsProvided',
    },
    materialRoleOrder: (palette.materials || []).map((entry) => ({
      role: entry.role,
      robloxMaterial: entry.robloxMaterial,
      color: entry.color,
      applyTo: `Codex-owned objects tagged role=${entry.role}`,
    })),
    lightingProfile: lighting,
    atmosphereProfile: atmosphere,
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd materials execute-preview "${safeGoal(goal)}"`,
  };
}

module.exports = {
  createMaterialApplyPlan,
};
