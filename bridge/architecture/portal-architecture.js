'use strict';

const { attachment, color, folder, light, model, part, prompt, vec3 } = require('./schema');
const { createArchGrammar } = require('./arch-grammar');

function compilePortalArchitecture(parsed, style, basePath, moduleGrid) {
  const goal = parsed.goal;
  const palette = style.palette;
  const arch = createArchGrammar(parsed, style, moduleGrid);
  const root = `${basePath}.PortalArchitecture`;
  const ops = [
    model(root, 'portalArchitecture', { goal }),
    folder(`${root}.Structure`, 'portalStructure', { goal }),
    folder(`${root}.DepthLayers`, 'portalDepthLayers', { goal }),
    folder(`${root}.Sockets`, 'portalSockets', { goal }),
    part(`${root}.Structure.BasePlinth`, 'basePlinth', { Size: vec3(30, 2, 7), Position: vec3(0, 1, -55), Color: palette[0], Material: 'Slate', CanCollide: true }, { goal, budgetCost: 4 }),
    part(`${root}.Structure.LeftPillar`, 'sidePillar', { Size: vec3(4, 18, 5), Position: vec3(-11, 10, -55), Color: palette[0], Material: 'Slate', CanCollide: true }, { goal, budgetCost: 4 }),
    part(`${root}.Structure.RightPillar`, 'sidePillar', { Size: vec3(4, 18, 5), Position: vec3(11, 10, -55), Color: palette[0], Material: 'Slate', CanCollide: true }, { goal, budgetCost: 4 }),
    part(`${root}.Structure.InnerFrame`, 'innerFrame', { Size: vec3(18, 14, 1.2), Position: vec3(0, 10, -55.25), Color: palette[1], Material: 'Neon', Transparency: 0.28 }, { goal, budgetCost: 3 }),
    part(`${root}.Structure.OuterFrame`, 'outerFrame', { Size: vec3(26, 18, 1), Position: vec3(0, 10, -55.65), Color: palette[2] || palette[1], Material: 'Metal' }, { goal, budgetCost: 3 }),
    part(`${root}.Structure.Keystone`, 'keystone', { Size: vec3(5, 4, 4), Position: vec3(0, 20, -55), Color: palette[2] || palette[1], Material: 'Metal' }, { goal, budgetCost: 2 }),
  ];
  for (const segment of arch.segments) {
    if (segment.role === 'keystone') continue;
    ops.push(part(`${root}.Structure.ArchSegment${segment.index + 1}`, 'archSegment', {
      Size: vec3(3.4, 3.2, 4.2),
      Position: vec3(segment.offset * 2.3, 18 + Math.max(0, 3 - Math.abs(segment.offset)) * 0.75, -55),
      Color: palette[0],
      Material: 'Slate',
      CanCollide: true,
    }, { goal, budgetCost: 2, attributes: { ArchSegmentIndex: segment.index } }));
  }
  ops.push(
    part(`${root}.DepthLayers.BackRim`, 'depthLayerBackRim', { Size: vec3(28, 20, 0.6), Position: vec3(0, 10, -56.2), Color: color(0.02, 0.02, 0.04), Material: 'Slate' }, { goal, budgetCost: 2 }),
    part(`${root}.DepthLayers.FrontTrimBand`, 'depthLayerFrontTrim', { Size: vec3(31, 1, 1), Position: vec3(0, 3, -53.95), Color: palette[2] || palette[1], Material: 'Metal' }, { goal, budgetCost: 1 }),
    part(`${root}.DepthLayers.LeftBrokenRuinChunk`, 'brokenRuinVariant', { Size: vec3(3, 4, 3), Position: vec3(-15, 3, -52), Color: palette[0], Material: 'Slate' }, { goal, budgetCost: 1 }),
    part(`${root}.DepthLayers.RightBrokenRuinChunk`, 'brokenRuinVariant', { Size: vec3(2.5, 3, 3), Position: vec3(15, 2.5, -52), Color: palette[0], Material: 'Slate' }, { goal, budgetCost: 1 }),
    part(`${root}.Sockets.LeftFloatingCrystalAnchor`, 'floatingCrystalAnchor', { Size: vec3(2, 5, 2), Position: vec3(-15, 7, -50), Color: palette[1], Material: 'Neon', Transparency: 0.12, CanCollide: false }, { goal, budgetCost: 2 }),
    part(`${root}.Sockets.RightFloatingCrystalAnchor`, 'floatingCrystalAnchor', { Size: vec3(2, 5, 2), Position: vec3(15, 8, -50), Color: palette[1], Material: 'Neon', Transparency: 0.12, CanCollide: false }, { goal, budgetCost: 2 }),
    attachment(`${root}.Structure.InnerFrame.PortalVfxSocket`, 'vfxSocket', { goal }),
    attachment(`${root}.Sockets.LeftFloatingCrystalAnchor.CrystalVfxSocket`, 'vfxSocket', { goal }),
    attachment(`${root}.Sockets.RightFloatingCrystalAnchor.CrystalVfxSocket`, 'vfxSocket', { goal }),
    attachment(`${root}.Structure.Keystone.CameraFocusSocket`, 'cameraFocus', { goal }),
    light(`${root}.Structure.InnerFrame.PortalCoreLight`, 'lightingSocket', { Brightness: 2.2, Range: 28, Color: palette[1] }, { goal }),
    prompt(`${root}.Structure.BasePlinth.PortalPromptAnchor`, 'promptAnchor', { ObjectText: 'Dungeon Gate', ActionText: 'Enter' }, { goal }),
    part(`${root}.CollisionProxy`, 'collisionProxy', { Size: vec3(26, 15, 1), Position: vec3(0, 9, -54.6), Transparency: 0.94, Material: 'ForceField', CanCollide: true, Color: color(0.1, 1, 1) }, { goal, budgetCost: 1 }),
  );
  return ops;
}

module.exports = { compilePortalArchitecture };
