'use strict';

const { TAXONOMY } = require('./schema');

function classifyAssetFamily(role, parsed) {
  const tags = new Set(['generatedModel', 'materialVariantNeeded', 'collisionProxyNeeded', 'lodVariantNeeded']);
  if (['pathTrim', 'groundTiles', 'wallModules', 'propsSmall', 'propsMedium', 'collisionProxies'].includes(role)) tags.add('robloxPrimitive');
  if (['focalLandmarks', 'secondaryLandmarks', 'portalModules', 'shopModules'].includes(role)) {
    tags.add('kitbashModel');
    tags.add('meshNeeded');
    tags.add('surfaceAppearanceNeeded');
    tags.add('manualExternalRequired');
  }
  if (['signage', 'shopModules', 'questModules', 'portalModules'].includes(role)) tags.add('decalNeeded');
  if (['vfxSockets'].includes(role)) tags.add('vfxSocketOnly');
  if (['audioSockets'].includes(role)) tags.add('audioSocketOnly');
  if (parsed.needsMaterial) tags.add('textureNeeded');
  if (parsed.needsSockets) tags.add('animationSocketOnly');
  return TAXONOMY.filter((item) => tags.has(item));
}

module.exports = { classifyAssetFamily };
