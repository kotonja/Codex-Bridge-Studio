'use strict';

const { ROOTS, VERSION, goalId, hashGoal, nowIso } = require('./schema');
const { parseGoal } = require('./goal-parser');

function manifestPath(goal) {
  const id = `${goalId(goal)}_${hashGoal(goal).slice(0, 6)}`;
  return `${ROOTS.replicatedStorage}.Manifests.${id}`;
}

function createManifest(goal, parts = {}) {
  const parsed = parseGoal(goal);
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: parsed.goal,
    qaPlanId: parsed.qaPlanId,
    swarmId: parsed.swarmId,
    runId: parsed.runId,
    manifestPath: manifestPath(parsed.goal),
    roots: ROOTS,
    plan: parts.plan || null,
    swarm: parts.swarm || null,
    launchReadiness: parts.launchReadiness || null,
    issues: parts.issues || [],
    fixPlan: parts.fixPlan || null,
    warnings: parts.warnings || [],
    blockers: parts.blockers || [],
    nextCommand: `tools\\bridge.cmd qa launch "${parsed.goal}"`,
  };
}

module.exports = { createManifest, manifestPath };
