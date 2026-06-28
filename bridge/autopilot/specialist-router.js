'use strict';

const SPECIALISTS = {
  premium: { command: 'tools\\bridge.cmd premium plan "<goal>"', evidence: 'premiumScore', mutation: 'readOnlyPlanOrCodexOwnedPremiumRound' },
  worldgen: { command: 'tools\\bridge.cmd worldgen audit "<goal>"', evidence: 'worldgenAudit', mutation: 'Codex-owned worldgen only' },
  assetforge: { command: 'tools\\bridge.cmd assetforge audit "<goal>"', evidence: 'assetforgeAudit', mutation: 'Codex-owned assets only' },
  visual: { command: 'tools\\bridge.cmd visual critique "<goal>"', evidence: 'visualCritique', mutation: 'readOnly or Codex-owned polish plan' },
  cinematic: { command: 'tools\\bridge.cmd cinematic audit "<goal>"', evidence: 'cinematicAudit', mutation: 'Codex-owned cinematic package only' },
  qa: { command: 'tools\\bridge.cmd qa launch "<goal>"', evidence: 'qaLaunchReadiness', mutation: 'Codex-owned QA reports/markers only' },
  output: { command: 'tools\\bridge.cmd output errors', evidence: 'outputErrors', mutation: 'readOnly' },
  pluginHealth: { command: 'tools\\bridge.cmd plugin-health', evidence: 'pluginHealth', mutation: 'readOnly' },
  testPilot: { command: 'tools\\bridge.cmd test snapshot', evidence: 'testSnapshot', mutation: 'local runtime only' },
  vfx: { command: 'tools\\bridge.cmd vfx audit "<goal>"', evidence: 'vfxAudit', mutation: 'Codex-owned VFX only' },
  animation: { command: 'tools\\bridge.cmd animation director', evidence: 'animationManifest', mutation: 'Codex-owned generated animation only' },
  audio: { command: 'tools\\bridge.cmd audio audit Workspace', evidence: 'audioAudit', mutation: 'sound-property audit with backups only' },
};

function routeSpecialists(goalClass, policy) {
  const allowed = new Set(policy.allowedSpecialists || Object.keys(SPECIALISTS));
  const preferred = {
    wholeGame: ['premium', 'worldgen', 'assetforge', 'visual', 'cinematic', 'qa', 'output', 'pluginHealth'],
    world: ['worldgen', 'visual', 'assetforge', 'qa', 'premium'],
    assetKit: ['assetforge', 'visual', 'qa', 'premium'],
    visualPolish: ['visual', 'assetforge', 'worldgen', 'qa'],
    cinematicMoment: ['cinematic', 'vfx', 'animation', 'audio', 'qa', 'visual'],
    qaLaunch: ['qa', 'visual', 'premium', 'output', 'pluginHealth'],
    regression: ['qa', 'output', 'pluginHealth'],
    bugFix: ['output', 'qa', 'premium', 'visual'],
  }[goalClass] || ['premium', 'visual', 'qa'];
  return preferred.filter((id) => allowed.has(id)).map((id) => ({ id, ...SPECIALISTS[id] }));
}

function commandFor(id, goal) {
  const item = SPECIALISTS[id];
  return item ? item.command.replace('<goal>', goal) : null;
}

module.exports = { SPECIALISTS, commandFor, routeSpecialists };
