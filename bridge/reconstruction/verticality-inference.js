'use strict';

const { confidenceFromEvidence } = require('./confidence');

function createVerticalityPlan(ctx) {
  const q = ctx.goal.toLowerCase();
  const evidence = ctx.sourceEvidence;
  const wantsVertical = /tower|stairs|upper|balcony|multi[- ]?floor|mansion|castle|dungeon|temple/.test(q);
  const links = wantsVertical ? [
    {
      id: 'upper_balcony_stairs',
      type: 'stair',
      from: 'primary_hall',
      to: 'upper_balcony',
      gameplayUse: 'Optional camera vista, boss reveal, or later-world portal balcony.',
      confidence: confidenceFromEvidence(evidence, 0.44, { unseenSide: true, interiorFromExterior: true }),
    },
  ] : [
    {
      id: 'none_required_first_pass',
      type: 'none',
      from: 'level_1',
      to: null,
      gameplayUse: 'Keep the first playable reconstruction single-level for mobile clarity.',
      confidence: 0.68,
    },
  ];
  return {
    requiresVerticalLink: wantsVertical,
    links,
    risks: wantsVertical ? ['Stairs can hide objectives if the first route is not strongly lit.'] : ['Single-level design may feel less impressive for castle/mansion references.'],
  };
}

module.exports = {
  createVerticalityPlan,
};

