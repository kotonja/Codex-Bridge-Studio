'use strict';

const { folder, materialBasePath, model, part, stringValue, vec3 } = require('./schema');

function createSwatchBoard(goal, palette, parsed, options = {}) {
  const basePath = options.basePath || `${materialBasePath(goal, options.suffix || 'Swatches')}.SwatchBoard`;
  const ops = [
    folder('Workspace.CodexProduction', 'productionRoot', { goal }),
    folder('Workspace.CodexMaterialSwatches', 'swatchRoot', { goal }),
    model(basePath, 'materialSwatchBoard', { goal }),
  ];
  palette.materials.forEach((entry, index) => {
    const x = (index % 6) * 3.2 - 8;
    const z = Math.floor(index / 6) * 3.2;
    ops.push(part(`${basePath}.${entry.role}_MaterialSwatch`, 'materialSwatch', {
      Size: vec3(2.5, 0.35, 2.5),
      Position: vec3(x, 2, z),
      Material: entry.robloxMaterial,
      Color: entry.color,
      CanCollide: false,
    }, { goal, attributes: { CodexMaterialRoleName: entry.role }, budgetCost: 0.5 }));
  });
  palette.baseColors.forEach((entry, index) => {
    ops.push(part(`${basePath}.BaseColor_${index + 1}`, 'baseColorChip', {
      Size: vec3(1.4, 0.25, 1.4),
      Position: vec3(-8 + index * 1.8, 0.8, 8),
      Material: 'SmoothPlastic',
      Color: entry,
      CanCollide: false,
    }, { goal, budgetCost: 0.25 }));
  });
  palette.accentColors.forEach((entry, index) => {
    ops.push(part(`${basePath}.GlowAccent_${index + 1}`, 'glowColorChip', {
      Size: vec3(1.4, 0.25, 1.4),
      Position: vec3(2 + index * 1.8, 0.8, 8),
      Material: 'Neon',
      Color: entry,
      Transparency: 0.08,
      CanCollide: false,
    }, { goal, budgetCost: 0.5 }));
  });
  ops.push(stringValue(`${basePath}.MaterialPaletteManifest`, 'materialPaletteManifest', JSON.stringify({
    goal,
    styleId: parsed.styleId,
    baseColors: palette.baseColors,
    accentColors: palette.accentColors,
    materials: palette.materials,
  }, null, 2), { goal }));
  return {
    ok: true,
    version: options.version,
    goal,
    styleId: parsed.styleId,
    basePath,
    operationCount: ops.length,
    operations: ops,
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd materials lighting "${goal}"`,
  };
}

module.exports = {
  createSwatchBoard,
};
