'use strict';

const { createSurfaceAppearancePlan } = require('./surface-appearance-plan');

function createMaterialPlan(goal, families = [], style) {
  const materialVariants = style.materialLanguage.map((material, index) => ({
    id: `${style.id}_${material}_variant_${index + 1}`,
    baseMaterial: material,
    color: style.colorPalette[index % style.colorPalette.length],
    roughnessIntent: index % 2 === 0 ? 'clean satin readability' : 'slightly rough gameplay-safe surface',
    metalnessIntent: /metal|gold|chrome|silver|iron/i.test(material + style.colorPalette.join(' ')) ? 'trim-only metal' : 'non-metal fallback',
    emissionIntent: index === 0 ? 'hero accent glow only' : 'none or socket-local glow',
    mobileFallback: `Use built-in ${material} with palette color and no SurfaceAppearance maps.`,
  }));
  const surfaceAppearanceCandidates = families
    .filter((family) => family.taxonomy.includes('surfaceAppearanceNeeded'))
    .slice(0, 8)
    .map((family) => createSurfaceAppearancePlan(family.id, style));
  return {
    ok: true,
    goal,
    styleId: style.id,
    materialVariants,
    surfaceAppearanceCandidates,
    fallbackRobloxMaterials: style.materialLanguage,
    colorPalette: style.colorPalette,
    roughnessMetalnessIntent: 'Hero trims get contrast; walkable/readable parts stay simple and mobile-safe.',
    emissionGlowIntent: 'Glow is socket-local or trim-local; avoid full asset neon spam.',
    textureDecalRequirements: ['directional signage', 'hero emblem/rune', 'trim masks', 'optional surface maps when imported manually'],
    mobileFallback: ['disable SurfaceAppearance on distant LODs', 'use built-in materials', 'reduce transparent/emissive overlap'],
    forbiddenMaterialMistakes: style.forbiddenCheapPatterns,
    warnings: surfaceAppearanceCandidates.length ? ['SurfaceAppearance texture maps are manualRequired unless existing asset IDs are discovered in-place.'] : [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd assetforge sockets "${goal}"`,
  };
}

module.exports = { createMaterialPlan };
