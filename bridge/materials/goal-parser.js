'use strict';

const { safeGoal, slugify } = require('./schema');
const { inferStyle } = require('./style-catalog');

function parseGoal(goal, options = {}) {
  const clean = safeGoal(goal || options.goal || options.intent || options.text);
  const q = clean.toLowerCase();
  const focus = new Set(['palette', 'applyPlan', 'swatches']);
  if (/light|lighting|lantern|sconce|fixture|rim|key light/.test(q)) focus.add('lighting');
  if (/atmosphere|fog|mist|haze|bloom|color correction|ambient/.test(q)) focus.add('atmosphere');
  if (/glow|neon|emissive|portal|crystal/.test(q)) focus.add('glow');
  if (/fixture|lantern|sconce|path marker|portal rim/.test(q)) focus.add('fixtures');
  if (/mobile|performance|budget/.test(q)) focus.add('mobileBudget');
  if (/audit|score|critique/.test(q)) focus.add('audit');
  if (/polish|improve|fix/.test(q)) focus.add('polish');
  if (!focus.has('lighting')) focus.add('lighting');
  if (!focus.has('atmosphere')) focus.add('atmosphere');
  if (!focus.has('fixtures')) focus.add('fixtures');
  if (!focus.has('glow')) focus.add('glow');
  return {
    goal: clean,
    slug: slugify(clean, 'materials'),
    styleId: options.styleId || inferStyle(clean),
    focus: Array.from(focus),
    wantsPbr: /pbr|surfaceappearance|texture|normal map|roughness|metalness|albedo/.test(q),
    wantsGlobalLighting: /global lighting|change lighting service|apply lighting|lighting properties/.test(q),
  };
}

module.exports = {
  parseGoal,
};
