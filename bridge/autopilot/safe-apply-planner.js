'use strict';

const { ROOTS, VERSION, nowIso } = require('./schema');
const { parseGoal } = require('./goal-parser');
const { createFixPlan } = require('./safe-fix-planner');

function createSafeApplyPlan(goal, options = {}) {
  const parsed = parseGoal(goal);
  const fixPlan = createFixPlan(parsed.goal);
  const safeActions = fixPlan.actions.filter((action) => action.autoApplyAllowed);
  const createdPaths = safeActions.length ? [
    `${ROOTS.plans}.${parsed.autopilotId}`,
    `${ROOTS.fixPlans}.${parsed.autopilotId}`,
    `${ROOTS.workspace}.${parsed.autopilotId}`,
  ] : [];
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: parsed.goal,
    autopilotId: parsed.autopilotId,
    status: options.studioConnected ? 'codexOwnedSafeApplyPlan' : 'manualRequired',
    createdPaths,
    safeActions,
    skippedActions: fixPlan.actions.filter((action) => !action.autoApplyAllowed),
    manualRequiredActions: fixPlan.manualRequiredActions,
    warnings: options.studioConnected ? [] : ['Studio evidence is unavailable; returning a safe apply plan instead of pretending mutations ran.'],
    blockers: [],
    nextCommand: `tools\\bridge.cmd autopilot retest "${parsed.goal}"`,
  };
}

module.exports = { createSafeApplyPlan };
