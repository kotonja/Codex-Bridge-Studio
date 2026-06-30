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
    part(`${portal}.Structure.BasePlinth`, 'macroPlinth', { Material: 'Slate', Color: stone, Size: shape.plinth }, { goal, budgetCost: 3 }),
    part(`${portal}.Structure.LeftPillar`, 'leftPillar', { Material: 'Slate', Color: stone, Size: shape.pillar }, { goal, budgetCost: 3 }),
    part(`${portal}.Structure.RightPillar`, 'rightPillar', { Material: 'Slate', Color: stone, Size: shape.pillar }, { goal, budgetCost: 3 }),
    part(`${portal}.Structure.TopKeystone`, 'topKeystone', { Material: 'Slate', Color: stone, Size: shape.keystone }, { goal, budgetCost: 3 }),
    neon(`${portal}.Structure.InnerPortalGlow`, 'portalCore', shape.glow, glow, { goal, budgetCost: 4 }),
    neon(`${portal}.Structure.BackRimGlow`, 'portalBackRim', vec3(shape.glow.x + 2, shape.glow.y + 2, 0.25), (style.palette && style.palette[3]) || glow, { goal, budgetCost: 3 }),
    trimBand(`${portal}.Trim.BaseFrontGold`, 'primaryTrim', style, vec3(shape.plinth.x, 0.35, 0.35), { goal }),
    trimBand(`${portal}.Trim.LeftPillarTrim`, 'verticalTrim', style, vec3(0.35, shape.pillar.y, 0.35), { goal }),
    trimBand(`${portal}.Trim.RightPillarTrim`, 'verticalTrim', style, vec3(0.35, shape.pillar.y, 0.35), { goal }),
    runeInset(`${portal}.Trim.CenterRuneInset`, 'runeInset', style, vec3(4, 0.16, 0.25), { goal }),
    rivet(`${portal}.Trim.LeftRivet`, 'rivet', style, { goal }),
    rivet(`${portal}.Trim.RightRivet`, 'rivet', style, { goal }),
    part(`${portal}.Structure.LeftCrystalCluster`, 'crystalCluster', { Material: 'Glass', Color: (style.palette && style.palette[3]) || color(0.1, 0.8, 1), Size: vec3(1.5, 4, 1.5), Transparency: 0.2 }, { goal, budgetCost: 2 }),
    part(`${portal}.Structure.RightCrystalCluster`, 'crystalCluster', { Material: 'Glass', Color: (style.palette && style.palette[3]) || color(0.1, 0.8, 1), Size: vec3(1.5, 4, 1.5), Transparency: 0.2 }, { goal, budgetCost: 2 }),
    transparentProxy(`${portal}.Collision.PortalBlockingProxy`, 'collisionProxy', vec3(shape.glow.x + 3, shape.glow.y + 3, 0.5), { goal }),
    attachment(`${portal}.Structure.InnerPortalGlow.PortalCoreVfx`, 'vfxSocket', { goal }),
    attachment(`${portal}.Structure.LeftCrystalCluster.LeftCrystalVfx`, 'vfxSocket', { goal }),
    attachment(`${portal}.Structure.RightCrystalCluster.RightCrystalVfx`, 'vfxSocket', { goal }),
    light(`${portal}.Structure.InnerPortalGlow.PortalCoreLight`, 'lightingSocket', 'PointLight', { Brightness: 2.6, Range: 24, Color: glow }, { goal }),
    particle(`${portal}.Structure.InnerPortalGlow.PortalMistPlaceholder`, 'vfxPlaceholder', { goal }),
    sound(`${portal}.Structure.InnerPortalGlow.PortalHumCue`, 'audioSocket', { goal }),
    prompt(`${portal}.Structure.BasePlinth.PortalPrompt`, 'promptSocket', { ObjectText: 'Portal Gate', ActionText: 'Inspect' }, { goal }),
  ];
  ops.push(...bevelFrame(`${portal}.Trim.PortalFrame`, style, { goal }));
  return ops;
}

module.exports = {
  compilePortal,
};
