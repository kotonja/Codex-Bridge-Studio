'use strict';

const { VERSION, nowIso } = require('./schema');
const { createAbilityWindowPlan } = require('./ability-window-planner');
const { createHitStopPlan } = require('./hitstop-planner');
const { createMobileMotionBudget } = require('./mobile-motion-budget');
const { createScreenShakePlan } = require('./screen-shake-planner');
const { createUiPunchPlan } = require('./ui-punch-planner');

function createGameFeelPlan(parsed, timeline) {
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: parsed.goal,
    anticipationClarity: 'show intent before commitment through pose, glow, and camera settle',
    inputBufferSuggestion: 'open a short buffer during Windup, close at Impact unless combo design says otherwise',
    damageContactWindow: createAbilityWindowPlan(parsed, timeline).windows.find((w) => w.id === 'damageWindow'),
    hitStop: createHitStopPlan(parsed, timeline),
    cameraShakeEnvelope: createScreenShakePlan(parsed, timeline).envelope,
    rumble: { manualRequired: true, reason: 'Roblox/gamepad haptics require explicit runtime support; V68 records placeholder intent only.' },
    uiPunch: createUiPunchPlan(parsed, timeline),
    cooldownReadinessFeedback: 'Recovery marker should restore input/cooldown clarity with UI color, sound, or pose release',
    recoveryTiming: 'Recovery should be long enough to read weight but short enough to preserve responsiveness',
    playerControlLockPolicy: parsed.momentType === 'cutscene' || parsed.momentType === 'bossIntro' ? 'brief cinematic lock with clear release marker' : 'avoid full lock; prefer aim/movement assist windows',
    accessibilityFallback: 'reduced camera shake, lower flash brightness, no rapid alternating FOV',
    mobileMotionBudget: createMobileMotionBudget(parsed),
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd cinematic audit "${parsed.goal}"`,
  };
}

module.exports = { createGameFeelPlan };
