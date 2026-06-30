'use strict';

const { color, vec3 } = require('./schema');
const { folder, model, neon, part } = require('./part-grammar');
const { trimBand } = require('./trim-grammar');

function compileInterior(parsed, style, basePath) {
  const goal = parsed.goal;
  const base = `${basePath}.InteriorReference`;
  const floorTint = (style.palette && style.palette[0]) || color(0.16, 0.14, 0.2);
  const accent = (style.palette && style.palette[1]) || color(0.55, 0.12, 1);
  return [
    model(base, 'interiorRoomKit', { goal }),
    folder(`${base}.RoomShell`, 'roomShell', { goal }),
    part(`${base}.RoomShell.FloorPlate`, 'interiorFloor', { Material: 'Slate', Color: floorTint, Size: vec3(22, 0.35, 18) }, { goal, budgetCost: 4 }),
    part(`${base}.RoomShell.BackWallModule`, 'interiorWall', { Material: 'SmoothPlastic', Color: floorTint, Size: vec3(22, 9, 0.7) }, { goal, budgetCost: 3 }),
    part(`${base}.RoomShell.LeftAlcove`, 'sideAlcove', { Material: 'Slate', Color: floorTint, Size: vec3(4, 6, 4) }, { goal, budgetCost: 2 }),
    part(`${base}.RoomShell.RightAlcove`, 'sideAlcove', { Material: 'Slate', Color: floorTint, Size: vec3(4, 6, 4) }, { goal, budgetCost: 2 }),
    trimBand(`${base}.RoomShell.FloorGoldLane`, 'floorTrim', style, vec3(18, 0.18, 0.2), { goal }),
    trimBand(`${base}.RoomShell.WallCrownTrim`, 'wallTrim', style, vec3(20, 0.25, 0.25), { goal }),
    neon(`${base}.RoomShell.BackRuneStrip`, 'interiorRuneGlow', vec3(7, 0.18, 0.22), accent, { goal, budgetCost: 1 }),
  ];
}

module.exports = {
  compileInterior,
};
