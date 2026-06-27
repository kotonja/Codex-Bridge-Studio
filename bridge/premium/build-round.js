'use strict';

const { VERSION, BUILD_PHASES, nowIso, hasExternalRisk } = require('./schema');

function createBuildRoundPlan(brief, styleBible, assetForgePlan, worldGrammarPlan) {
  const goal = brief.goal;
  const phases = BUILD_PHASES.map((name, index) => ({
    index: index + 1,
    name,
    objective: [
      'Establish scale, paths, and focal footprint.',
      'Place hero focal and secondary landmark silhouettes.',
      'Add named sockets for portals, prompts, VFX, audio, camera, and QA.',
      'Set depth lighting rules and focal contrast.',
      'Place low-cost placeholder VFX anchors.',
      'Add readable signs/prompts without final UI lock-in.',
      'Add sound cue placeholders and SoundGroup notes.',
      'Add trims, rails, color accents, and micro detail where useful.',
      'Add QA markers for spawn, objective, interactables, and camera beats.',
      'Audit mobile and part/emitter/light budgets.',
    ][index],
    route: [
      `tools\\bridge.cmd build plan "${goal}"`,
      `tools\\bridge.cmd generate_scene "${goal}"`,
      `tools\\bridge.cmd generate_scene "${goal}"`,
      `tools\\bridge.cmd lighting preview`,
      `tools\\bridge.cmd vfx pro-plan "${goal}"`,
      `tools\\bridge.cmd ui director`,
      `tools\\bridge.cmd audio plan balanced`,
      `tools\\bridge.cmd premium polish "${goal}"`,
      `tools\\bridge.cmd test snapshot`,
      `tools\\bridge.cmd premium score <manifestPath>`,
    ][index],
  }));
  const risks = hasExternalRisk({ goal });
  return {
    version: VERSION,
    at: nowIso(),
    goal,
    phases,
    specialistRoutes: {
      buildDirector: `tools\\bridge.cmd generate_scene "${goal}"`,
      proVfx: `tools\\bridge.cmd generate_pro_vfx "${goal}"`,
      animation: `tools\\bridge.cmd animation choreographer`,
      motionVfx: `tools\\bridge.cmd motion-vfx plan "${goal}"`,
      abilityForge: `tools\\bridge.cmd ability plan "${goal}"`,
      audioDirector: `tools\\bridge.cmd audio plan balanced`,
      testPilot: `tools\\bridge.cmd test plan full`,
      cameraScreen: `tools\\bridge.cmd camera director`,
    },
    executionPolicy: 'orchestrate existing specialist commands; do not duplicate specialist engines',
    warnings: risks.length ? [`External-risk terms detected for manual review: ${risks.join(', ')}`] : [],
    blockers: [],
    evidence: ['ten-phase premium sequence', 'specialist reuse map', 'Full Trust local audit model'],
    nextCommand: `tools\\bridge.cmd premium critique "${goal}"`,
  };
}

module.exports = { createBuildRoundPlan };
