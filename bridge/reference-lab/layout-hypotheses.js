'use strict';

function createLayoutHypotheses(ctx) {
  const goal = ctx.clean.replace(/"/g, '\\"');
  return [
    {
      id: 'faithful-front-facing-layout',
      description: 'Recreate the reference as a frontal hero composition with the focal gate/landmark centered and supporting props flanking it.',
      zones: ['spawn foreground', 'central hero landmark', 'left support cluster', 'right support cluster', 'background vista'],
      paths: ['spawn-to-landmark main path', 'left/right side loops'],
      landmarks: [ctx.isDungeon ? 'glowing portal arch' : 'main hub sign', 'side interactable signs'],
      cameraBeats: ['wide establishing shot', 'slow push to focal landmark'],
      risks: ['may prioritize visual fidelity over gameplay route clarity'],
      nextCommand: `tools\\bridge.cmd worldgen graph "${goal}"`,
    },
    {
      id: 'gameplay-first-layout',
      description: 'Use the reference style but reorganize zones around player flow: spawn, first objective, reward/shop, portal/combat gate.',
      zones: ['spawn orientation', 'first objective pad', 'upgrade/shop side zone', 'portal/combat destination'],
      paths: ['clear onboarding route', 'return loop', 'side reward path'],
      landmarks: ['objective marker', 'portal gate', 'reward kiosk'],
      cameraBeats: ['spawn reveal', 'objective pan', 'portal anticipation'],
      risks: ['may deviate from exact reference composition'],
      nextCommand: `tools\\bridge.cmd worldgen graph "${goal}"`,
    },
    {
      id: 'mobile-optimized-layout',
      description: 'Reduce clutter and widen routes so the reference reads on phone screens while preserving the key silhouette and palette.',
      zones: ['large spawn pad', 'single dominant focal landmark', 'two side clusters maximum', 'safe negative-space ring'],
      paths: ['oversized main route', 'short side loops'],
      landmarks: ['dominant portal/sign', 'large icon interactables'],
      cameraBeats: ['static readable spawn view', 'short orbit around landmark'],
      risks: ['less dense than concept if not polished with trim/VFX'],
      nextCommand: `tools\\bridge.cmd worldgen graph "${goal}"`,
    },
  ];
}

module.exports = {
  createLayoutHypotheses,
};
