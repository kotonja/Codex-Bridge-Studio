'use strict';

const { color, vec3 } = require('./schema');
const { attachment, folder, light, model, neon, part, particle, prompt, sound, transparentProxy } = require('./part-grammar');
const { portalShape } = require('./shape-grammar');
const { bevelFrame } = require('./bevel-illusion');
const { rivet, runeInset, trimBand } = require('./trim-grammar');

function compilePortal(parsed, style, basePath) {
  const goal = parsed.goal;
  const shape = portalShape(parsed.scale);
  const portal = `${basePath}.PortalGate`;
  const stone = (style.palette && style.palette[0]) || color(0.12, 0.1, 0.16);
  const glow = (style.palette && style.palette[1]) || color(0.55, 0.1, 1);
  const ops = [
    model(portal, 'portalGate', { goal }),
    folder(`${portal}.Structure`, 'portalStructure', { goal }),
    folder(`${portal}.Trim`, 'portalTrim', { goal }),
    folder(`${portal}.Sockets`, 'portalSockets', { goal }),
    folder(`${portal}.Collision`, 'portalCollision', { goal }),
    part(`${portal}.Structure.BasePlinth`, 'macroPlinth', { Material: 'Slate', Color: stone, Size: shape.plinth, Position: vec3(0, shape.plinth.y / 2, -55), CanCollide: true }, { goal, budgetCost: 3 }),
    part(`${portal}.Structure.LeftPillar`, 'leftPillar', { Material: 'Slate', Color: stone, Size: shape.pillar, Position: vec3(-shape.width / 2, shape.pillar.y / 2 + shape.plinth.y, -55), CanCollide: true }, { goal, budgetCost: 3 }),
    part(`${portal}.Structure.RightPillar`, 'rightPillar', { Material: 'Slate', Color: stone, Size: shape.pillar, Position: vec3(shape.width / 2, shape.pillar.y / 2 + shape.plinth.y, -55), CanCollide: true }, { goal, budgetCost: 3 }),
    part(`${portal}.Structure.TopKeystone`, 'topKeystone', { Material: 'Slate', Color: stone, Size: shape.keystone, Position: vec3(0, shape.height, -55), CanCollide: true }, { goal, budgetCost: 3 }),
    neon(`${portal}.Structure.InnerPortalGlow`, 'portalCore', { ...shape.glow, Position: vec3(0, shape.height * 0.52, -55.35) }, glow, { goal, budgetCost: 4 }),
    neon(`${portal}.Structure.BackRimGlow`, 'portalBackRim', { ...vec3(shape.glow.x + 2, shape.glow.y + 2, 0.25), Position: vec3(0, shape.height * 0.52, -55.75) }, (style.palette && style.palette[3]) || glow, { goal, budgetCost: 3 }),
    trimBand(`${portal}.Trim.BaseFrontGold`, 'primaryTrim', style, vec3(shape.plinth.x, 0.35, 0.35), { goal, position: vec3(0, shape.plinth.y + 0.25, -51.3), attributes: { PositionHint: 'front base trim' } }),
    trimBand(`${portal}.Trim.LeftPillarTrim`, 'verticalTrim', style, vec3(0.35, shape.pillar.y, 0.35), { goal, position: vec3(-shape.width / 2, shape.pillar.y / 2 + shape.plinth.y, -51.2), attributes: { PositionHint: 'left pillar front trim' } }),
    trimBand(`${portal}.Trim.RightPillarTrim`, 'verticalTrim', style, vec3(0.35, shape.pillar.y, 0.35), { goal, position: vec3(shape.width / 2, shape.pillar.y / 2 + shape.plinth.y, -51.2), attributes: { PositionHint: 'right pillar front trim' } }),
    runeInset(`${portal}.Trim.CenterRuneInset`, 'runeInset', style, vec3(4, 0.16, 0.25), { goal, position: vec3(0, shape.height * 0.52, -51), attributes: { PositionHint: 'center rune inset' } }),
    rivet(`${portal}.Trim.LeftRivet`, 'rivet', style, { goal, position: vec3(-shape.width * 0.62, shape.height - 1, -51), attributes: { PositionHint: 'left rivet' } }),
    rivet(`${portal}.Trim.RightRivet`, 'rivet', style, { goal, position: vec3(shape.width * 0.62, shape.height - 1, -51), attributes: { PositionHint: 'right rivet' } }),
    part(`${portal}.Structure.LeftCrystalCluster`, 'crystalCluster', { Material: 'Glass', Color: (style.palette && style.palette[3]) || color(0.1, 0.8, 1), Size: vec3(1.5, 4, 1.5), Position: vec3(-shape.width * 0.72, 5.5, -50), Transparency: 0.2, CanCollide: false }, { goal, budgetCost: 2 }),
    part(`${portal}.Structure.RightCrystalCluster`, 'crystalCluster', { Material: 'Glass', Color: (style.palette && style.palette[3]) || color(0.1, 0.8, 1), Size: vec3(1.5, 4, 1.5), Position: vec3(shape.width * 0.72, 6.5, -50), Transparency: 0.2, CanCollide: false }, { goal, budgetCost: 2 }),
    transparentProxy(`${portal}.Collision.PortalBlockingProxy`, 'collisionProxy', { ...vec3(shape.glow.x + 3, shape.glow.y + 3, 0.5), Position: vec3(0, shape.height * 0.52, -54.9) }, { goal }),
    attachment(`${portal}.Structure.InnerPortalGlow.PortalCoreVfx`, 'vfxSocket', { goal }),
    attachment(`${portal}.Structure.LeftCrystalCluster.LeftCrystalVfx`, 'vfxSocket', { goal }),
    attachment(`${portal}.Structure.RightCrystalCluster.RightCrystalVfx`, 'vfxSocket', { goal }),
    light(`${portal}.Structure.InnerPortalGlow.PortalCoreLight`, 'lightingSocket', 'PointLight', { Brightness: 2.6, Range: 24, Color: glow }, { goal }),
    particle(`${portal}.Structure.InnerPortalGlow.PortalMistPlaceholder`, 'vfxPlaceholder', { goal }),
    sound(`${portal}.Structure.InnerPortalGlow.PortalHumCue`, 'audioSocket', { goal }),
    prompt(`${portal}.Structure.BasePlinth.PortalPrompt`, 'promptSocket', { ObjectText: 'Portal Gate', ActionText: 'Inspect' }, { goal }),
  ];
  ops.push(...bevelFrame(`${portal}.Trim.PortalFrame`, style, { goal, origin: vec3(0, shape.height * 0.52, -51), width: shape.glow.x + 3, height: shape.glow.y + 3 }));
  return ops;
}

module.exports = {
  compilePortal,
};
