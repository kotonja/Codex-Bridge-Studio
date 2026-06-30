'use strict';

const { color, vec3 } = require('./schema');
const { attachment, folder, model, neon, part, prompt } = require('./part-grammar');

function compilePropClusters(parsed, style, basePath) {
  const goal = parsed.goal;
  const base = `${basePath}.PropClusters`;
  const primary = (style.palette && style.palette[1]) || color(0.55, 0.12, 1);
  const gold = (style.palette && style.palette[2]) || color(0.95, 0.72, 0.24);
  return [
    model(base, 'propClusters', { goal }),
    folder(`${base}.Crystals`, 'crystalClusterGroup', { goal }),
    part(`${base}.Crystals.FloatCrystalA`, 'floatingCrystal', { Material: 'Glass', Color: primary, Size: vec3(1.2, 4, 1.2), Transparency: 0.18 }, { goal, budgetCost: 1.5 }),
    part(`${base}.Crystals.FloatCrystalB`, 'floatingCrystal', { Material: 'Glass', Color: primary, Size: vec3(0.9, 3, 0.9), Transparency: 0.2 }, { goal, budgetCost: 1 }),
    attachment(`${base}.Crystals.FloatCrystalA.CrystalAuraSocket`, 'vfxSocket', { goal }),
    folder(`${base}.QuestBoard`, 'questBoardCluster', { goal }),
    part(`${base}.QuestBoard.BoardPostLeft`, 'boardPost', { Material: 'Wood', Color: color(0.26, 0.16, 0.1), Size: vec3(0.55, 4, 0.55) }, { goal }),
    part(`${base}.QuestBoard.BoardPostRight`, 'boardPost', { Material: 'Wood', Color: color(0.26, 0.16, 0.1), Size: vec3(0.55, 4, 0.55) }, { goal }),
    part(`${base}.QuestBoard.BoardFace`, 'questBoardFace', { Material: 'Wood', Color: color(0.34, 0.22, 0.12), Size: vec3(5, 3, 0.3) }, { goal, budgetCost: 2 }),
    prompt(`${base}.QuestBoard.BoardFace.QuestPrompt`, 'promptSocket', { ObjectText: 'Quest Board', ActionText: 'View' }, { goal }),
    folder(`${base}.RewardChest`, 'rewardChestCluster', { goal }),
    part(`${base}.RewardChest.ChestBase`, 'rewardChest', { Material: 'Metal', Color: color(0.25, 0.12, 0.08), Size: vec3(3.2, 1.5, 2) }, { goal, budgetCost: 2 }),
    part(`${base}.RewardChest.ChestTrim`, 'rewardTrim', { Material: 'Metal', Color: gold, Size: vec3(3.4, 0.28, 2.2) }, { goal }),
    neon(`${base}.RewardChest.RewardGlow`, 'rewardVfxPlaceholder', vec3(2.4, 0.2, 1.4), primary, { goal }),
  ];
}

module.exports = {
  compilePropClusters,
};
