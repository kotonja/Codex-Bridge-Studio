'use strict';

const { PHASES, VERSION, nowIso } = require('./schema');
const { parseGoal } = require('./goal-parser');
const { createPolicy } = require('./loop-policy');

const COMMANDS = {
  preflight: 'tools\\bridge.cmd connect',
  'baseline evidence': 'tools\\bridge.cmd baseline mark',
  'production planning': 'tools\\bridge.cmd premium plan "<goal>"',
  'build/generate': 'tools\\bridge.cmd premium build "<goal>"',
  'visual critique': 'tools\\bridge.cmd visual critique "<goal>"',
  'QA swarm': 'tools\\bridge.cmd qa launch "<goal>"',
  'issue normalization': 'tools\\bridge.cmd autopilot issues "<goal>"',
  'safe fix planning': 'tools\\bridge.cmd autopilot fix-plan "<goal>"',
  'safe apply or manualRequired': 'tools\\bridge.cmd autopilot apply-safe "<goal>"',
  polish: 'tools\\bridge.cmd autopilot polish "<goal>"',
  retest: 'tools\\bridge.cmd autopilot retest "<goal>"',
  'score aggregation': 'tools\\bridge.cmd autopilot score "<goal>"',
  'stop/continue decision': 'tools\\bridge.cmd autopilot report "<goal>"',
  'final report': 'tools\\bridge.cmd autopilot report "<goal>"',
};

function createLoopPlan(goal) {
  const parsed = parseGoal(goal);
  const policy = createPolicy(parsed.policyId);
  const phases = PHASES.map((phase, index) => ({
    index: index + 1,
    phase,
    purpose: `Run ${phase} for a bounded production loop.`,
    specialistCommand: (COMMANDS[phase] || 'tools\\bridge.cmd codex-context').replace('<goal>', parsed.goal),
    expectedEvidence: phase.includes('evidence') ? ['pluginHealth', 'outputErrors', 'visualCritique', 'qaLaunchReadiness'] : [phase],
    mutationAllowance: ['build/generate', 'safe apply or manualRequired', 'polish'].includes(phase) ? 'Codex-owned only, within policy mutation budget' : 'readOnly',
    safetyClassification: ['safe apply or manualRequired'].includes(phase) ? 'manualRequiredWhenUnsafe' : 'boundedAutopilotPhase',
    timeoutMs: Math.min(30000, Math.max(5000, Math.floor(policy.maxRuntimeMs / PHASES.length))),
    successCriteria: ['returns structured JSON', 'records evidence or missing-evidence reason', 'does not hit external-risk blocker'],
    failCriteria: ['command timeout', 'stale Studio', 'plugin version mismatch', 'external/account risk', 'unbounded destructive action'],
    nextPhase: PHASES[index + 1] || null,
  }));
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    goal: parsed.goal,
    autopilotId: parsed.autopilotId,
    policy,
    phases,
    warnings: [],
    blockers: [],
    nextCommand: `tools\\bridge.cmd autopilot round "${parsed.goal}"`,
  };
}

module.exports = { createLoopPlan };
