'use strict';

const { color, vec3 } = require('./schema');
const { folder, model, neon, part, prompt } = require('./part-grammar');
const { buildingShape } = require('./shape-grammar');
const { bevelFrame } = require('./bevel-illusion');
const { trimBand } = require('./trim-grammar');

function compileBuilding(parsed, style, basePath) {
  const goal = parsed.goal;
  const shape = buildingShape(parsed.scale);
  const base = `${basePath}.BuiltStructures`;
  const tint = (style.palette && style.palette[0]) || color(0.2, 0.18, 0.25);
  return [
    model(base, 'buildingGroup', { goal }),
    folder(`${base}.ShopQuestStand`, 'shopQuestStand', { goal }),
    part(`${base}.ShopQuestStand.Foundation`, 'buildingFoundation', { Material: 'Slate', Color: tint, Size: shape.base }, { goal, budgetCost: 3 }),
    part(`${base}.ShopQuestStand.BackWall`, 'facadeWall', { Material: 'SmoothPlastic', Color: tint, Size: shape.wall }, { goal, budgetCost: 4 }),
    part(`${base}.ShopQuestStand.LeftColumn`, 'supportColumn', { Material: 'Slate', Color: tint, Size: shape.column }, { goal, budgetCost: 2 }),
    part(`${base}.ShopQuestStand.RightColumn`, 'supportColumn', { Material: 'Slate', Color: tint, Size: shape.column }, { goal, budgetCost: 2 }),
    part(`${base}.ShopQuestStand.RoofCap`, 'roofCap', { Material: 'Metal', Color: (style.palette && style.palette[2]) || color(0.9, 0.68, 0.25), Size: shape.roof }, { goal, budgetCost: 3 }),
    neon(`${base}.ShopQuestStand.ReadableSign`, 'signagePanel', shape.sign, (style.palette && style.palette[1]) || color(0.55, 0.12, 1), { goal, budgetCost: 2 }),
    trimBand(`${base}.ShopQuestStand.RoofTrimFront`, 'roofTrim', style, vec3(shape.roof.x, 0.28, 0.28), { goal }),
    trimBand(`${base}.ShopQuestStand.SignTrim`, 'signTrim', style, vec3(shape.sign.x, 0.22, 0.22), { goal }),
    prompt(`${base}.ShopQuestStand.ReadableSign.ShopQuestPrompt`, 'promptSocket', { ObjectText: 'Shop / Quest', ActionText: 'Open' }, { goal }),
    ...bevelFrame(`${base}.ShopQuestStand.FacadeBevel`, style, { goal }),
  ];
}

module.exports = {
  compileBuilding,
};
