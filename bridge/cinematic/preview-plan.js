'use strict';

const { VERSION, nowIso } = require('./schema');

function createPreviewPlan(parsed, manifestPath) {
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: parsed.goal,
    manifestPath,
    strategy: ['use camera/screen helpers if installed', 'preview marker timeline as structured evidence', 'fallback to manualRequired when runtime harness is unavailable'],
    manualRequired: true,
    manualRequiredReason: 'Cinematic preview playback requires a loaded Studio place with camera/screen/runtime harnesses; this report is safe and non-blocking.',
    commands: [
      `tools\\bridge.cmd cinematic timeline "${parsed.goal}"`,
      `tools\\bridge.cmd camera director`,
      `tools\\bridge.cmd visual critique "${parsed.goal}"`,
    ],
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd visual critique "${parsed.goal}"`,
  };
}

module.exports = { createPreviewPlan };
