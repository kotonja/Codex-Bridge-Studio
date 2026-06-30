'use strict';

function createVariants(parsed) {
  return [
    { id: 'hero', description: 'strongest silhouette with full trim and sockets', mobileCost: 'medium' },
    { id: 'ruined', description: 'broken asymmetry, missing bays, larger readable chunks', mobileCost: 'medium' },
    { id: 'mobileLow', description: 'fewer arch segments, fewer lights, trim merged into larger bands', mobileCost: 'low' },
    { id: 'interiorConnector', description: 'adds doorway and room shell continuation modules', mobileCost: 'medium' },
  ].map((variant) => ({ ...variant, recommended: variant.id === parsed.variantIntent || (variant.id === 'hero' && parsed.variantIntent === 'hero') }));
}

module.exports = { createVariants };
