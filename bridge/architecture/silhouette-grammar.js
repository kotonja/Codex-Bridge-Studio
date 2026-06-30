'use strict';

function createSilhouetteGrammar(parsed, style, moduleGrid) {
  return {
    silhouetteLanguage: style.silhouetteLanguage,
    primaryShape: parsed.systems.portal ? 'hero threshold arch' : 'modular architectural mass',
    secondaryShapes: ['side supports', 'upper crown', 'foreground plinth', 'readable socket markers'],
    scaleHierarchy: ['macro form first', 'secondary bays second', 'accent trims last'],
    moduleGrid,
    risk: 'Avoid evenly spaced random cubes; silhouette should read at mobile distance.',
  };
}

module.exports = { createSilhouetteGrammar };
