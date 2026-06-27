'use strict';

const { REQUIRED_ZONE_ROLES, vec3 } = require('./schema');
const { zoneDensityBudget } = require('./density-budget');
const { mobileFallback } = require('./mobile-fallback');
const { socketsForRole } = require('./gameplay-sockets');

const zoneTemplates = [
  ['spawn', 'spawn', 0, 0, 0, 52, 20, 52, 1],
  ['primary_focal', 'primaryFocalPoint', 0, 8, -92, 72, 50, 60, 1],
  ['shop', 'shop', -78, 0, -32, 44, 24, 38, 2],
  ['quest', 'quest', 72, 0, -36, 42, 24, 38, 2],
  ['portal_nexus', 'portal', 0, 0, -156, 58, 36, 44, 1],
  ['training', 'training', 86, 0, 38, 50, 24, 42, 3],
  ['social', 'social', -82, 0, 42, 48, 22, 42, 3],
  ['reward', 'reward', 0, 0, 74, 42, 24, 36, 3],
  ['transition', 'transition', 0, 0, -52, 38, 18, 28, 2],
  ['vista', 'vista', 116, 12, -108, 44, 30, 36, 4],
  ['combat', 'combat', 122, 0, -18, 62, 24, 52, 3],
  ['boss_preview', 'bossPreview', -124, 0, -116, 58, 34, 42, 3],
  ['upgrade', 'upgrade', -122, 0, -8, 44, 24, 38, 3],
  ['event', 'event', 0, 0, 128, 54, 24, 42, 4],
  ['secret', 'secret', -146, 4, 92, 34, 20, 28, 5],
];

function shouldInclude(role, parsed) {
  if (['spawn', 'primaryFocalPoint', 'transition', 'vista'].includes(role)) return true;
  if (parsed.archetype === 'arena') return ['combat', 'bossPreview', 'reward', 'training', 'upgrade', 'portal', 'social'].includes(role);
  if (parsed.archetype === 'dungeon') return ['quest', 'portal', 'combat', 'bossPreview', 'reward', 'secret', 'shop', 'training'].includes(role);
  if (parsed.archetype === 'hub') return ['shop', 'quest', 'portal', 'training', 'social', 'reward', 'upgrade', 'event'].includes(role);
  return ['shop', 'quest', 'portal', 'training', 'combat', 'reward', 'secret'].includes(role);
}

function createZone(template, parsed) {
  const [id, role, x, y, z, sx, sy, sz, priority] = template;
  return {
    id,
    role,
    position: vec3(x, y, z),
    size: vec3(sx, sy, sz),
    priority,
    readability: {
      readableFromSpawn: ['spawn', 'primaryFocalPoint', 'shop', 'quest', 'portal'].includes(role),
      labelNeeded: !['spawn', 'transition', 'vista'].includes(role),
      silhouetteRule: role === 'primaryFocalPoint' ? 'largest and tallest silhouette in the first camera cone' : 'distinct outline and color accent',
    },
    densityBudget: zoneDensityBudget(role, parsed.scale),
    mobileFallback: mobileFallback(role),
    sockets: socketsForRole(role),
  };
}

function createZones(parsed) {
  const zones = zoneTemplates
    .filter((template) => shouldInclude(template[1], parsed))
    .map((template) => createZone(template, parsed));
  const included = new Set(zones.map((zone) => zone.role));
  const omissions = REQUIRED_ZONE_ROLES
    .filter((role) => !included.has(role))
    .map((role) => ({ role, reason: `${role} is not required for a ${parsed.archetype} ${parsed.scale} layout first pass.` }));
  return { zones, omissions };
}

module.exports = { createZones };
