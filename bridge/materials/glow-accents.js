'use strict';

const { materialBasePath, model, part, light, stringValue, vec3 } = require('./schema');

function createGlowAccentPlan(goal, palette, parsed, options = {}) {
  const primary = palette.accentColors[0];
  const secondary = palette.accentColors[1] || primary;
  return {
    ok: true,
    version: options.version,
    goal,
    styleId: parsed.styleId,
    rules: ['hero glow first', 'small guide glows second', 'transparent glow planes are non-collide placeholders', 'never use neon for the whole base structure'],
    accents: [
      { id: 'PortalCoreGlow', role: 'portal core', material: 'Neon', color: primary, position: vec3(0, 5, -20), size: vec3(5, 5, 0.45), light: { brightness: 1.6, range: 18 } },
      { id: 'CrystalGlowA', role: 'crystal accent', material: 'Neon', color: secondary, position: vec3(-14, 3.5, -8), size: vec3(1.2, 3.5, 1.2), light: { brightness: 0.5, range: 9 } },
      { id: 'CrystalGlowB', role: 'crystal accent', material: 'Neon', color: secondary, position: vec3(14, 3.5, -8), size: vec3(1.2, 3.5, 1.2), light: { brightness: 0.5, range: 9 } },
      { id: 'RouteGlowLine', role: 'path readability', material: 'Neon', color: secondary, position: vec3(0, 0.12, 6), size: vec3(18, 0.12, 0.45), light: null },
    ],
    vfxSocketHints: ['portalCenter', 'leftCrystal', 'rightCrystal', 'pathGuide'],
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd materials mobile-budget "${goal}"`,
  };
}

function compileGlowAccents(goal, palette, parsed, options = {}) {
  const plan = createGlowAccentPlan(goal, palette, parsed, options);
  const basePath = options.basePath || `${materialBasePath(goal, options.suffix || 'Preview')}.GlowAccents`;
  const ops = [model(basePath, 'glowAccentSet', { goal })];
  plan.accents.forEach((accent) => {
    const partPath = `${basePath}.${accent.id}`;
    ops.push(part(partPath, 'glowAccent', {
      Size: accent.size,
      Position: accent.position,
      Material: accent.material,
      Color: accent.color,
      Transparency: accent.id === 'RouteGlowLine' ? 0.18 : 0.08,
      CanCollide: false,
    }, { goal, attributes: { CodexGlowRole: accent.role }, budgetCost: 1 }));
    if (accent.light) {
      ops.push(light(`${partPath}.GlowLight`, 'glowAccentLight', 'PointLight', {
        Brightness: accent.light.brightness,
        Range: accent.light.range,
        Color: accent.color,
        Shadows: false,
      }, { goal, attributes: { CodexGlowRole: accent.role }, budgetCost: 2 }));
    }
  });
  ops.push(stringValue(`${basePath}.GlowAccentManifest`, 'glowAccentManifest', JSON.stringify(plan, null, 2), { goal }));
  return { plan, operations: ops };
}

module.exports = {
  compileGlowAccents,
  createGlowAccentPlan,
};
