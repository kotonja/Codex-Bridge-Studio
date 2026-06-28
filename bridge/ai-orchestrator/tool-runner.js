'use strict';

const Memory = require('../memory');
const Premium = require('../premium');
const Worldgen = require('../worldgen');
const AssetForge = require('../assetforge');
const Cinematic = require('../cinematic');
const QaSwarm = require('../qa-swarm');
const Autopilot = require('../autopilot');
const Visual = require('../visual');
const Execution = require('../execution');
const { mutationGate } = require('./approval-gates');

function runLocalTool(name, args = {}, run = {}) {
  const goal = args.goal || run.goal || 'premium Roblox production goal';
  const gate = mutationGate(run, name);
  if (!gate.ok) {
    return { ok: false, status: gate.status, tool: name, reason: gate.reason, nextCommand: gate.nextCommand };
  }
  const map = {
    memory_recommend: () => Memory.getMemoryRecommendations(goal),
    premium_plan: () => Premium.createPremiumManifest(goal, { source: 'ai-orchestrator' }),
    worldgen_graph: () => Worldgen.createLayoutGraph(goal),
    assetforge_kit: () => AssetForge.createKitPlan(goal),
    cinematic_timeline: () => Cinematic.createTimelinePlan(goal),
    execute_preview: () => Execution.preview(goal, { source: 'ai-orchestrator' }),
    execute_apply: () => ({ ok: false, status: 'manualRequired', reason: 'Use tools\\bridge.cmd execute apply so V72 can queue Studio transaction safely.', nextCommand: `tools\\bridge.cmd execute apply "${goal}"` }),
    execute_verify: () => Execution.verify(args.transactionId || goal),
    execute_rollback: () => ({ ok: false, status: 'manualRequired', reason: 'Use tools\\bridge.cmd execute rollback so V72 can target the live Studio plugin safely.', nextCommand: `tools\\bridge.cmd execute rollback ${args.transactionId || '<transactionId>'}` }),
    visual_critique: () => Visual.createCritiqueReport(goal),
    qa_launch: () => QaSwarm.createLaunchReadinessReport(goal),
    autopilot_report: () => Autopilot.createReport ? Autopilot.createReport(goal) : Autopilot.createFinalReport(goal),
    memory_learn: () => Memory.learnFromProductionReport(goal, { source: 'ai-orchestrator' }),
  };
  if (!map[name]) return { ok: false, status: 'unsupportedTool', tool: name, nextCommand: 'tools\\bridge.cmd ai tools' };
  return map[name]();
}

module.exports = {
  runLocalTool,
};
