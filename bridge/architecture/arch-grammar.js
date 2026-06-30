'use strict';

const { color, part, vec3 } = require('./schema');

function createArchGrammar(parsed, style, moduleGrid) {
  const segments = parsed.power === 'large' ? 9 : 7;
  return {
    segmentCount: segments,
    proportions: { width: moduleGrid.bayWidth * 2, height: moduleGrid.verticalModule * 2.5, thickness: moduleGrid.wallThickness },
    segments: Array.from({ length: segments }, (_, index) => ({
      index,
      role: index === Math.floor(segments / 2) ? 'keystone' : 'archSegment',
      offset: index - Math.floor(segments / 2),
    })),
    rules: style.archRules,
    mobileFallback: { segmentCount: Math.min(5, segments), keepKeystone: true },
  };
}

function compileArchGrammar(parsed, style, basePath, moduleGrid) {
  const grammar = createArchGrammar(parsed, style, moduleGrid);
  const goal = parsed.goal;
  const ops = [
    part(`${basePath}.ArchGrammar.BaseLintel`, 'archBaseLintel', {
      Size: vec3(grammar.proportions.width + moduleGrid.unit, moduleGrid.unit * 0.4, moduleGrid.wallThickness * 1.2),
      Position: vec3(0, moduleGrid.unit * 2.2, 0),
      Material: 'Slate',
      Color: color(0.11, 0.09, 0.16),
    }, { goal }),
  ];
  const center = Math.floor(grammar.segmentCount / 2);
  for (const segment of grammar.segments) {
    const isKey = segment.index === center;
    const x = segment.offset * moduleGrid.unit * 0.55;
    const heightLift = Math.max(0, center - Math.abs(segment.offset)) * moduleGrid.unit * 0.18;
    ops.push(part(`${basePath}.ArchGrammar.Segment_${segment.index + 1}`, isKey ? 'archKeystone' : 'archSegment', {
      Size: vec3(moduleGrid.unit * (isKey ? 0.7 : 0.55), moduleGrid.unit * (isKey ? 0.95 : 0.75), moduleGrid.wallThickness * 1.35),
      Position: vec3(x, grammar.proportions.height + heightLift, 0),
      Material: isKey ? 'Marble' : 'Slate',
      Color: isKey ? color(0.68, 0.55, 0.86) : color(0.13, 0.1, 0.19),
    }, { goal }));
  }
  ops.push(part(`${basePath}.ArchGrammar.InnerShadowBand`, 'archInnerShadowBand', {
    Size: vec3(grammar.proportions.width * 0.84, moduleGrid.unit * 0.22, moduleGrid.wallThickness * 1.42),
    Position: vec3(0, moduleGrid.unit * 2.85, 0.08),
    Material: 'SmoothPlastic',
    Color: color(0.05, 0.04, 0.08),
  }, { goal }));
  return ops;
}

module.exports = { compileArchGrammar, createArchGrammar };
