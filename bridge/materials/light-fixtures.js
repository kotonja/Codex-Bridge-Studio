'use strict';

const { color, light, materialBasePath, model, part, stringValue, vec3 } = require('./schema');

function createLightFixturePlan(goal, palette, lighting, parsed, options = {}) {
  return {
    ok: true,
    version: options.version,
    goal,
    styleId: parsed.styleId,
    fixtures: [
      { id: 'portalRimLeft', type: 'sconce', lightClass: 'PointLight', position: vec3(-7, 6, -18), color: palette.accentColors[0], brightness: 1.2, range: 14 },
      { id: 'portalRimRight', type: 'sconce', lightClass: 'PointLight', position: vec3(7, 6, -18), color: palette.accentColors[0], brightness: 1.2, range: 14 },
      { id: 'pathGuideA', type: 'pathMarker', lightClass: 'PointLight', position: vec3(-10, 2, 8), color: palette.accentColors[1] || palette.accentColors[0], brightness: 0.45, range: 10 },
      { id: 'pathGuideB', type: 'pathMarker', lightClass: 'PointLight', position: vec3(10, 2, 8), color: palette.accentColors[1] || palette.accentColors[0], brightness: 0.45, range: 10 },
      { id: 'heroKeyProxy', type: 'hiddenLightAnchor', lightClass: 'SpotLight', position: vec3(0, 12, 6), color: color(0.78, 0.72, 0.86), brightness: 0.75, range: 24 },
    ],
    budget: { maxLightsMobile: 8, plannedLights: 5, withinBudget: true },
    warnings: lighting.warnings || [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd materials glow "${goal}"`,
  };
}

function compileLightFixtures(goal, palette, lighting, parsed, options = {}) {
  const plan = createLightFixturePlan(goal, palette, lighting, parsed, options);
  const basePath = options.basePath || `${materialBasePath(goal, options.suffix || 'Preview')}.LightFixtures`;
  const ops = [model(basePath, 'lightFixtureSet', { goal })];
  plan.fixtures.forEach((fixture) => {
    const partPath = `${basePath}.${fixture.id}`;
    ops.push(part(partPath, fixture.type, {
      Size: fixture.type === 'hiddenLightAnchor' ? vec3(1, 1, 1) : vec3(1.6, 1.6, 1.6),
      Position: fixture.position,
      Material: fixture.type === 'hiddenLightAnchor' ? 'ForceField' : 'Metal',
      Color: fixture.type === 'hiddenLightAnchor' ? fixture.color : color(0.55, 0.45, 0.32),
      Transparency: fixture.type === 'hiddenLightAnchor' ? 0.9 : 0,
      CanCollide: false,
    }, { goal, attributes: { CodexLightFixtureId: fixture.id }, budgetCost: 1 }));
    ops.push(light(`${partPath}.${fixture.id}Light`, 'materialFixtureLight', fixture.lightClass, {
      Brightness: fixture.brightness,
      Range: fixture.range,
      Color: fixture.color,
      Shadows: fixture.type !== 'pathMarker',
    }, { goal, attributes: { CodexLightFixtureId: fixture.id }, budgetCost: 2 }));
  });
  ops.push(stringValue(`${basePath}.LightingPlanManifest`, 'lightingPlanManifest', JSON.stringify({ lighting, plan }, null, 2), { goal }));
  return { plan, operations: ops };
}

module.exports = {
  compileLightFixtures,
  createLightFixturePlan,
};
