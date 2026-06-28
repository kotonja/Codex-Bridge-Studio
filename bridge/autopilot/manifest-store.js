'use strict';

const { ROOTS, VERSION, nowIso } = require('./schema');
const { parseGoal } = require('./goal-parser');

function manifestPath(goal) {
  const parsed = parseGoal(goal);
  return `${ROOTS.manifests}.${parsed.autopilotId}`;
}

function createManifest(goal, payload = {}) {
  const parsed = parseGoal(goal);
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: parsed.goal,
    autopilotId: parsed.autopilotId,
    manifestPath: manifestPath(parsed.goal),
    roots: ROOTS,
    attributes: {
      CodexGenerated: true,
      CodexSystem: 'Autopilot',
      CodexVersion: VERSION,
      CodexGoal: parsed.goal,
      CodexAutopilotId: parsed.autopilotId,
      CodexRound: payload.roundIndex || 0,
    },
    payload,
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd autopilot report "${parsed.goal}"`,
  };
}

module.exports = { createManifest, manifestPath };
