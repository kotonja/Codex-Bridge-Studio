'use strict';

const { VERSION, nowIso } = require('./schema');
const { parseGoal } = require('./goal-parser');

function createPerformanceProbePlan(goal, options = {}) {
  const parsed = parseGoal(goal);
  const metrics = [
    'output errors/warnings',
    'descendants count',
    'scripts count',
    'remotes count',
    'particle emitters',
    'lights',
    'beams/trails',
    'active loops/tweens risk',
    'physics/collision heavy parts',
    'transparent overdraw risk',
    'mobile fallback status',
    'runtime frame/performance evidence when available',
  ].map((label) => ({
    id: label.replace(/[^a-z0-9]+/gi, '_').toLowerCase(),
    label,
    observationOnly: true,
    source: label.includes('runtime frame') && !options.runtimeProfilerAvailable ? 'manualRequired/live harness if available' : 'StudioBridge inventory/watch/perf summaries',
    fakeProfilerReading: false,
    command: label.includes('output') ? 'tools\\bridge.cmd output errors' : label.includes('runtime frame') ? 'tools\\bridge.cmd test snapshot' : 'tools\\bridge.cmd vfx perf',
  }));
  return { ok: true, version: VERSION, at: nowIso(), goal: parsed.goal, metrics, profilerReadingsAreEstimated: true, warnings: ['No fake profiler readings are generated; runtime stats are reported only when observed.'], blockers: [], nextCommand: `tools\\bridge.cmd qa regression "${parsed.goal}"` };
}

module.exports = { createPerformanceProbePlan };
