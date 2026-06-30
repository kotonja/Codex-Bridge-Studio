'use strict';

const { vec3 } = require('./schema');
const { folder, model, part, stringValue } = require('./part-grammar');

function compileMaterialSwatches(parsed, style, basePath) {
  const goal = parsed.goal;
  const base = `${basePath}.MaterialSwatches`;
  const ops = [
    model(base, 'materialSwatches', { goal }),
    folder(`${base}.Palette`, 'paletteFolder', { goal }),
  ];
  (style.palette || []).forEach((entry, index) => {
    ops.push(part(`${base}.Palette.Swatch${index + 1}`, 'materialSwatch', {
      Material: style.materialHints[index % style.materialHints.length] || 'SmoothPlastic',
      Color: entry,
      Size: vec3(2, 0.35, 2),
    }, { goal, budgetCost: 0.5 }));
  });
  ops.push(stringValue(`${base}.Palette.StyleNotes`, 'styleNotes', JSON.stringify({
    styleId: style.id,
    trimLanguage: style.trimLanguage,
    materialHints: style.materialHints,
    forbidden: style.forbidden,
  }, null, 2), { goal }));
  return ops;
}

module.exports = {
  compileMaterialSwatches,
};
