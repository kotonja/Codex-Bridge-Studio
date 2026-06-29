'use strict';

function extractMaterialLanguage(ctx) {
  const builtInFallbacks = ['Neon for glow strips', 'Glass for portal panes', 'Metal for trims', 'Slate/Basalt for dungeon massing', 'SmoothPlastic for clean toy-like props'];
  return {
    likelyMaterials: ctx.isDungeon ? ['Slate', 'Basalt', 'Metal', 'Glass', 'Neon'] : ['SmoothPlastic', 'Metal', 'Glass', 'Neon'],
    surfaceFinish: ctx.isDark ? ['matte stone base', 'polished trim', 'controlled emissive accents'] : ['clean satin base', 'glossy trims', 'soft glowing highlights'],
    roughness: ctx.isDungeon ? 'high on stone, low on metal trim, very low on glass/portal core' : 'medium-low stylized plastic with selective shine',
    metal: ctx.q.includes('gold') || ctx.isDungeon ? 'gold/brass trim for premium read' : 'small metal accent only',
    glow: ctx.isDark || ctx.isSciFi || ctx.q.includes('portal') ? 'strong portal/edge glow with mobile-safe particle count' : 'soft reward/interactable glow',
    robloxBuiltInFallbacks: builtInFallbacks,
    robloxBuiltInMaterialFallbacks: builtInFallbacks,
    materialVariantSuggestions: ['PortalCore_Emissive', 'DungeonStone_Dark', 'GoldTrim_Polished', 'RuneGlass_Violet'],
    surfaceAppearanceManualRequiredSpecs: ['optional normal/roughness maps for hero gate', 'manual texture authoring required for exact concept fidelity', 'never fake unavailable texture ids'],
    mobileFallback: ['replace fine texture detail with larger color blocks', 'cap transparent layers', 'use fewer lights and stronger silhouettes'],
  };
}

module.exports = {
  extractMaterialLanguage,
};
