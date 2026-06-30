'use strict';

const { safeGoal, slugify } = require('./schema');
const { inferStyleId } = require('./style-catalog');

function parseGoal(goal, options = {}) {
  const clean = safeGoal(goal || options.goal || options.intent);
  const q = clean.toLowerCase();
  const focus = [];
  if (/portal|gate|arch/.test(q)) focus.push('portal');
  if (/building|facade|shop|stand|kiosk/.test(q)) focus.push('building');
  if (/inside|interior|room|hall/.test(q)) focus.push('interior');
  if (/path|road|walkway|bridge|misty path/.test(q)) focus.push('path');
  if (/prop|cluster|chest|quest|crystal|crate|board/.test(q)) focus.push('props');
  if (/light|fixture|lantern|glow/.test(q)) focus.push('lighting');
  if (/material|swatch|palette/.test(q)) focus.push('materials');
  if (/socket|vfx|audio|camera|prompt/.test(q)) focus.push('sockets');
  if (focus.length === 0) focus.push('portal', 'path', 'props', 'lighting', 'sockets');

  const scale = /tiny|throwaway|small/.test(q) ? 'small' : (/huge|massive|large|hub|world/.test(q) ? 'large' : 'medium');
  const detailLevel = /premium|high detail|detailed|less placeholder|built not placeholder|trim|bevel|polish/.test(q) ? 'high' : 'medium';
  const mobileTarget = !/desktop only|pc only/.test(q);

  return {
    goal: clean,
    slug: slugify(clean, 'detail'),
    styleId: options.styleId || inferStyleId(clean),
    focus,
    scale,
    detailLevel,
    mobileTarget,
    requestedExecution: /execute|apply|real|studio|build/.test(q),
    source: options.source || 'detail.goal-parser',
  };
}

module.exports = {
  parseGoal,
};
