'use strict';

function makeCandidate(id, name, role, importance, buildStrategy, hint, worldgenHint, notes = []) {
  return { id, name, role, importance, buildStrategy, assetForgeHint: hint, worldgenHint, notes };
}

function extractObjectCandidates(ctx) {
  const base = [
    makeCandidate('focal_landmark', ctx.isDungeon ? 'Glowing dungeon portal gate' : 'Main spawn landmark', 'landmark', 98, 'assetforgeKit', 'Create modular arch/core/trim kit with reusable sockets.', 'Central landmark at end of spawn sightline.', ['largest silhouette', 'must read from spawn']),
    makeCandidate('primary_path', 'Readable main path', 'path', 92, 'robloxPrimitive', 'Use modular floor tiles and trim rails.', 'Connect spawn to focal landmark with no ambiguity.', ['wide mobile-readable route']),
    makeCandidate('interaction_pads', 'Interaction pads / portals / shops', 'interactive', 86, 'robloxPrimitive', 'Create pad/sign/icon variants.', 'Place at side zones with clear labels.', ['needs UI/signage follow-up']),
    makeCandidate('trim_set', 'Premium trim set', 'trim', 80, 'assetforgeKit', 'Thin bevel strips, corner caps, rune bands, railings.', 'Use to unify all zones.', ['avoid over-detailing every surface']),
    makeCandidate('ambient_vfx', 'Ambient glow and particles', 'vfx', 76, 'vfxOnly', 'Portal motes, aura loops, dust/fog anchors.', 'Attach to focal landmark and reward objects.', ['mobile particle budget required']),
  ];
  if (ctx.isCombat) {
    base.push(makeCandidate('combat_stage', 'Combat staging circle', 'structure', 82, 'robloxPrimitive', 'Circular platform with hitbox/debug sockets.', 'Use as boss/ability test zone.', ['sync with cinematic and QA routes']));
  }
  return base;
}

module.exports = {
  extractObjectCandidates,
};
