'use strict';

const { color } = require('./schema');
const { folder, model, neon, part } = require('./part-grammar');
const { pathShape } = require('./shape-grammar');

function compilePath(parsed, style, basePath) {
  const goal = parsed.goal;
  const shape = pathShape(parsed.scale);
  const base = `${basePath}.ReadablePath`;
  const floor = (style.palette && style.palette[0]) || color(0.2, 0.19, 0.24);
  const accent = (style.palette && style.palette[2]) || color(0.95, 0.72, 0.24);
  const ops = [
    model(base, 'pathKit', { goal }),
    folder(`${base}.Slabs`, 'pathSlabs', { goal }),
    folder(`${base}.Edges`, 'pathEdges', { goal }),
  ];
  for (let i = 1; i <= 5; i += 1) {
    ops.push(part(`${base}.Slabs.MainSlab${i}`, 'pathSlab', { Material: 'Slate', Color: floor, Size: shape.slab }, { goal, budgetCost: 1 }));
    ops.push(part(`${base}.Edges.LeftEdge${i}`, 'pathEdgeTrim', { Material: 'Metal', Color: accent, Size: shape.edge }, { goal, budgetCost: 0.5 }));
    ops.push(part(`${base}.Edges.RightEdge${i}`, 'pathEdgeTrim', { Material: 'Metal', Color: accent, Size: shape.edge }, { goal, budgetCost: 0.5 }));
  }
  ops.push(neon(`${base}.DirectionGlow`, 'readabilityMarker', shape.marker, (style.palette && style.palette[1]) || color(0.6, 0.1, 1), { goal }));
  return ops;
}

module.exports = {
  compilePath,
};
