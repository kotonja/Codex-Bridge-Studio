'use strict';

const { EVIDENCE_SOURCES, VERSION, nowIso } = require('./schema');
const { parseGoal } = require('./goal-parser');

const SOURCE_COMMANDS = {
  pluginHealth: 'tools\\bridge.cmd plugin-health',
  connectionPlaceStatus: 'tools\\bridge.cmd places',
  outputErrors: 'tools\\bridge.cmd output errors',
  premiumScore: 'tools\\bridge.cmd premium score "<goal>"',
  visualCritique: 'tools\\bridge.cmd visual critique "<goal>"',
  worldgenAudit: 'tools\\bridge.cmd worldgen audit "<goal>"',
  assetforgeAudit: 'tools\\bridge.cmd assetforge audit "<goal>"',
  cinematicAudit: 'tools\\bridge.cmd cinematic audit "<goal>"',
  qaLaunchReadiness: 'tools\\bridge.cmd qa launch "<goal>"',
  qaIssueReport: 'tools\\bridge.cmd qa report "<goal>"',
  pluginBundleCheck: 'tools\\bridge.cmd plugin check',
  commandHistory: 'tools\\bridge.cmd commands',
  createdCodexPaths: 'tools\\bridge.cmd autopilot manifest "<goal>"',
  manualRequiredBlockers: 'tools\\bridge.cmd autopilot issues "<goal>"',
};

function unavailable(source, goal, reason = 'Live evidence has not been collected in this offline planner call.') {
  return {
    source,
    available: false,
    reason,
    nextCommand: (SOURCE_COMMANDS[source] || 'tools\\bridge.cmd codex-context').replace('<goal>', goal),
  };
}

function createEvidencePack(goal, options = {}) {
  const parsed = parseGoal(goal);
  const available = new Set(options.availableEvidence || []);
  const sources = EVIDENCE_SOURCES.map((source) => {
    if (available.has(source)) {
      return {
        source,
        available: true,
        summary: `${source} supplied by caller.`,
        evidence: options[source] || null,
        nextCommand: (SOURCE_COMMANDS[source] || '').replace('<goal>', parsed.goal),
      };
    }
    return unavailable(source, parsed.goal);
  });
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: parsed.goal,
    autopilotId: parsed.autopilotId,
    sources,
    availableCount: sources.filter((item) => item.available).length,
    missingCount: sources.filter((item) => !item.available).length,
    warnings: sources.some((item) => !item.available) ? ['Missing evidence is reported honestly and not fabricated.'] : [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd autopilot issues "${parsed.goal}"`,
  };
}

module.exports = { createEvidencePack, unavailable };
