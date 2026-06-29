'use strict';

const { VERSION, nowIso } = require('./schema');

const TOOL_CATALOG = [
  ['memory_recommend', 'Read redacted V71 memory recommendations for a goal.', false, 'readOnlyMemory', 'tools\\bridge.cmd memory recommend "<goal>"'],
  ['premium_plan', 'Create a premium production plan.', false, 'readOnlyPremiumPlan', 'tools\\bridge.cmd premium plan "<goal>"'],
  ['worldgen_graph', 'Create a PCG layout graph suggestion.', false, 'readOnlyWorldgenPlan', 'tools\\bridge.cmd worldgen graph "<goal>"'],
  ['assetforge_kit', 'Plan a reusable asset kit.', false, 'readOnlyAssetKitPlan', 'tools\\bridge.cmd assetforge kit "<goal>"'],
  ['cinematic_timeline', 'Plan cinematic motion/VFX/audio timing.', false, 'readOnlyCinematicPlan', 'tools\\bridge.cmd cinematic timeline "<goal>"'],
  ['execute_preview', 'Preview V72 execution actions without mutating Studio.', false, 'v72Preview', 'tools\\bridge.cmd execute preview "<goal>"'],
  ['execute_apply', 'Apply a V72 execution plan through transaction receipts.', true, 'v72Mutation', 'tools\\bridge.cmd execute apply "<goal>"'],
  ['execute_verify', 'Verify a V72 transaction receipt.', false, 'v72Verification', 'tools\\bridge.cmd execute verify <transactionId>'],
  ['execute_rollback', 'Rollback a V72 transaction-scoped CodexGenerated object set.', true, 'v72Rollback', 'tools\\bridge.cmd execute rollback <transactionId>'],
  ['reference_image', 'Analyze a local image file with metadata-only fallback or real API vision when configured.', false, 'readOnlyExplicitImageVision', 'tools\\bridge.cmd reference image "<imagePath>"'],
  ['worldcompile_image', 'Compile a local image reference into a playable-world package and V72 preview without applying.', false, 'readOnlyImageToWorldCompile', 'tools\\bridge.cmd worldcompile image "<imagePath>"'],
  ['visual_critique', 'Run visual evidence critique.', false, 'readOnlyVisualEvidence', 'tools\\bridge.cmd visual critique "<goal>"'],
  ['qa_launch', 'Run launch-readiness planning/evidence report.', false, 'readOnlyQaEvidence', 'tools\\bridge.cmd qa launch "<goal>"'],
  ['autopilot_report', 'Read closed-loop production report.', false, 'readOnlyAutopilotReport', 'tools\\bridge.cmd autopilot report "<goal>"'],
  ['memory_learn', 'Store a redacted memory lesson from a report.', true, 'localRedactedMemoryWrite', 'tools\\bridge.cmd memory learn "<goal>"'],
];

function toolEntry([name, description, mutating, safetyClass, helperCommand]) {
  return {
    name,
    description,
    safetyClass,
    mutating,
    requiresApproval: mutating,
    timeoutMs: mutating ? 45000 : 15000,
    helperCommand,
    outputContract: mutating ? 'structured JSON with ok/status/transactionId/warnings/blockers/nextCommand' : 'structured JSON with ok/version/warnings/blockers/nextCommand',
  };
}

function getToolCatalog() {
  return {
    ok: true,
    version: VERSION,
    at: nowIso(),
    tools: TOOL_CATALOG.map(toolEntry),
    warnings: [],
    blockers: [],
    nextCommand: 'tools\\bridge.cmd ai plan "premium anime dungeon hub"',
  };
}

module.exports = {
  TOOL_CATALOG,
  getToolCatalog,
  toolEntry,
};
