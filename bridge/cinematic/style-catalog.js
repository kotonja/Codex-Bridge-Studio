'use strict';

const { STYLE_IDS, VERSION } = require('./schema');

const base = {
  motionPillars: ['clear silhouette', 'readable anticipation', 'clean follow-through'],
  timingPillars: ['0.2s setup', 'visible windup', 'short impact hold', 'controlled recovery'],
  cameraLanguage: ['subject locked', 'small FOV punch', 'release back to player camera'],
  animationLanguage: ['strong key poses', 'marker-first timing', 'priority by gameplay role'],
  vfxLanguage: ['charge/trail/flash/burst/residue', 'socketed cleanup', 'mobile fallback intensity'],
  audioLanguage: ['riser', 'whoosh', 'impact transient', 'tail or reward cue'],
  uiPunchLanguage: ['brief scale pulse', 'status clarity', 'cooldown readiness feedback'],
  shakeRules: ['use envelope, not constant noise', 'cap mobile shake', 'shake on impact only'],
  hitStopRules: ['manifest only unless a safe runtime exists', 'never freeze Studio/editor', 'local ability window only'],
  mobileMotionHints: ['reduce camera amplitude', 'shorten residue', 'prefer readability over noise'],
  forbiddenCheapPatterns: ['random looping shake', 'VFX without timing markers', 'fake asset ids', 'audio spam', 'global pause'],
};

const overrides = {
  animeBossIntro: { cameraLanguage: ['low heroic dolly', 'slow orbit reveal', 'hard cut to player control'], animationLanguage: ['boss silhouette hold', 'chest/shoulder expansion', 'weapon or aura reveal'] },
  animeHeavyAttack: { timingPillars: ['long anticipation', 'snappy contact', 'impact freeze beat', 'heavy recovery'], vfxLanguage: ['body aura', 'hand/weapon charge', 'impact burst', 'smoke residue'] },
  animeDashSlash: { motionPillars: ['directional line of action', 'pre-dash coil', 'slash follow-through'], cameraLanguage: ['lateral pan', 'brief speed-line push', 'quick release'] },
  magicalGirlBurst: { vfxLanguage: ['sparkle charge', 'ring bloom', 'heart/star residue'], audioLanguage: ['sparkle rise', 'bright release', 'reward sting'] },
  elementalUltimate: { timingPillars: ['element build', 'muzzle/hand flash', 'projectile/beam travel', 'impact bloom'], vfxLanguage: ['element aura', 'beam/projectile core', 'shockwave', 'debris'] },
  simulatorRewardBurst: { motionPillars: ['fast reward pop', 'center-screen clarity', 'loop-safe celebration'], uiPunchLanguage: ['reward number pop', 'button bounce', 'claim confirmation'] },
  dungeonPortalOpen: { cameraLanguage: ['lookAt portal', 'slow FOV widen', 'return to path'], vfxLanguage: ['ring ignition', 'swirl core', 'ambient embers'] },
  bossRaidImpact: { hitStopRules: ['short local impact freeze illusion', 'damage window marker', 'do not pause nonparticipants'], shakeRules: ['one strong impulse', 'rapid decay'] },
  horrorReveal: { timingPillars: ['quiet setup', 'delayed reveal', 'sharp sting', 'silence recovery'], audioLanguage: ['low bed duck', 'sting', 'breath tail'] },
  sciFiDoorOpen: { motionPillars: ['mechanical anticipation', 'panel slide', 'light sweep'], vfxLanguage: ['edge glow', 'steam puff', 'status light'] },
  cyberpunkGlitch: { vfxLanguage: ['scanline flash', 'chromatic blocks', 'digital sparks'], uiPunchLanguage: ['glitch pulse', 'short text scramble'] },
  trainingDojoCombo: { animationLanguage: ['clean stance', 'one-two rhythm', 'balanced recovery'], cameraLanguage: ['stable sparring camera', 'small impact nudge'] },
  petSummon: { vfxLanguage: ['small portal', 'sparkle orbit', 'cute pop smoke'], audioLanguage: ['soft whoosh', 'reward chime'] },
  lootReveal: { uiPunchLanguage: ['rarity pulse', 'card flip', 'claim sparkle'], timingPillars: ['anticipation pause', 'reveal pop', 'readability hold'] },
  obbyCheckpointVictory: { motionPillars: ['jump/readable celebration', 'short loop-safe pop'], vfxLanguage: ['ring burst', 'confetti-lite', 'checkpoint glow'] },
  cinematicSpawnArrival: { cameraLanguage: ['spawn dolly', 'environment glimpse', 'player control release'], animationLanguage: ['landing pose', 'brief look around'] },
  arenaRoundStart: { timingPillars: ['countdown beat', 'lock-in pulse', 'go burst'], uiPunchLanguage: ['round label pop', 'timer emphasis'] },
  portalTravel: { cameraLanguage: ['forward pull', 'tunnel easing', 'soft release'], vfxLanguage: ['swirl streaks', 'edge glow', 'arrival puff'] },
};

function makeStyle(id, index) {
  return {
    id,
    version: VERSION,
    title: id.replace(/([A-Z])/g, ' $1').replace(/^./, (m) => m.toUpperCase()),
    ...base,
    ...(overrides[id] || {}),
    intensity: index % 3 === 0 ? 'high' : index % 3 === 1 ? 'medium' : 'controlled',
  };
}

const styles = STYLE_IDS.map(makeStyle);

function getStyleCatalog() {
  return styles.map((style) => ({ ...style }));
}

function getStyle(id) {
  return styles.find((style) => style.id === id) || styles[1];
}

module.exports = { getStyle, getStyleCatalog };
