'use strict';

const { safeGoal, slugify } = require('./schema');
const { inferStyleId } = require('./style-catalog');

function parseGoal(goal, options = {}) {
  const clean = safeGoal(goal || options.goal || options.intent || options.text);
  const q = clean.toLowerCase();
  const systems = {
    portal: /portal|gate|arch|threshold|boss|dungeon/.test(q),
    walls: /wall|building|dungeon|mansion|facility|interior|architecture|modular/.test(q),
    roof: /roof|building|mansion|dojo|castle|facility|upper silhouette/.test(q),
    windows: /window|mansion|building|facility|castle/.test(q),
    doors: /door|gate|portal|entrance|threshold|building/.test(q),
    pillars: /pillar|column|corner|gate|portal|temple|castle|dojo/.test(q),
    stairs: /stairs|stair|vertical|link|temple|castle|dungeon|hub/.test(q),
    interior: /interior|room|inside|mansion|dungeon|floorplan/.test(q),
    trims: /trim|bevel|depth|premium|architecture|dungeon|gate|portal/.test(q),
    depth: true,
  };
  if (!Object.values(systems).some(Boolean)) {
    systems.portal = true;
    systems.walls = true;
    systems.pillars = true;
    systems.trims = true;
  }
  return {
    goal: clean,
    slug: slugify(clean, 'architecture'),
    styleId: options.styleId || inferStyleId(clean),
    systems,
    power: /huge|massive|boss|raid/.test(q) ? 'large' : (/tiny|small|throwaway/.test(q) ? 'small' : 'medium'),
    variantIntent: /broken|ruin|destroyed/.test(q) ? 'ruined' : (/clean|polished/.test(q) ? 'clean' : 'hero'),
    source: options.source || 'architecture.goal-parser',
  };
}

module.exports = { parseGoal };
