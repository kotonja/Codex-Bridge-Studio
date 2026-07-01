'use strict';

const VALID_ROBLOX_MATERIALS = [
  'Plastic',
  'SmoothPlastic',
  'Neon',
  'Glass',
  'ForceField',
  'Metal',
  'DiamondPlate',
  'Concrete',
  'Slate',
  'Basalt',
  'Cobblestone',
  'Brick',
  'Granite',
  'Marble',
  'Wood',
  'WoodPlanks',
  'Grass',
  'Ground',
  'Sand',
  'Snow',
  'Ice',
  'Water',
  'Fabric',
  'Foil',
];

const ROLE_MATERIALS = {
  baseStone: 'Slate',
  trim: 'Metal',
  metal: 'Metal',
  glass: 'Glass',
  emissive: 'Neon',
  path: 'Cobblestone',
  crystal: 'Glass',
  wood: 'Wood',
  cloth: 'Fabric',
  water: 'Glass',
  fog: 'ForceField',
  accentStone: 'Basalt',
  ground: 'Ground',
};

function isValidMaterial(name) {
  return VALID_ROBLOX_MATERIALS.includes(String(name || ''));
}

function normalizeMaterial(name, fallback = 'SmoothPlastic') {
  const clean = String(name || '').trim();
  return isValidMaterial(clean) ? clean : fallback;
}

function materialForRole(role, fallback = 'SmoothPlastic') {
  return normalizeMaterial(ROLE_MATERIALS[role] || fallback, fallback);
}

function validateMaterialPalette(materials = []) {
  return materials.map((entry) => ({
    ...entry,
    robloxMaterial: normalizeMaterial(entry.robloxMaterial, materialForRole(entry.role)),
    validRobloxMaterial: isValidMaterial(normalizeMaterial(entry.robloxMaterial, materialForRole(entry.role))),
  }));
}

module.exports = {
  ROLE_MATERIALS,
  VALID_ROBLOX_MATERIALS,
  isValidMaterial,
  materialForRole,
  normalizeMaterial,
  validateMaterialPalette,
};
