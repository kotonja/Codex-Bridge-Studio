'use strict';

const Memory = require('../memory');
const ReferenceLab = require('../reference-lab');
const Reconstruction = require('../reconstruction');
const WorldCompiler = require('../world-compiler');
const Execution = require('../execution');
const Visual = require('../visual');
const Fidelity = require('../fidelity');
const QaSwarm = require('../qa-swarm');
const Autopilot = require('../autopilot');
const ImagePipeline = require('./image-pipeline');
const { VERSION, actionAllowed, hasExternalRisk, nowIso, redact, resultSummary, safeGoal } = require('./schema');

function extractGoal(args = {}) {
  return safeGoal(args.goal || args.intent || args.text || args.query || args.note || args.source || args.path || args.imagePath);
}

async function runAllowedAction(action, args = {}, options = {}) {
  if (!actionAllowed(action)) {
    return {
      ok: false,
      version: VERSION,
      status: 'blocked',
      reason: 'unknownDashboardAction',
      action,
      allowedActions: options.includeAllowedActions ? undefined : undefined,
      warnings: [],
      blockers: [`Unknown dashboard action: ${action}`],
      nextCommand: 'tools\\bridge.cmd dashboard self-check',
    };
  }
  const riskArgs = { ...args };
  delete riskArgs.precomputed;
  if (hasExternalRisk(riskArgs)) {
    return {
      ok: false,
      version: VERSION,
      status: 'blockedExternalRisk',
      action,
      warnings: [],
      blockers: ['Dashboard blocks publish/upload/marketplace/DataStore/save/economy/monetization-looking actions.'],
      nextCommand: 'Use a manual Roblox/account flow for external-risk operations.',
    };
  }

  const goal = extractGoal(args);
  let result;
  switch (action) {
    case 'status':
      result = options.status ? options.status() : { ok: true, version: VERSION, status: 'ready' };
      break;
    case 'pluginHealth':
      result = options.pluginHealth ? options.pluginHealth() : { ok: true, version: VERSION, status: 'availableThroughServerHealth' };
      break;
    case 'memoryRecommend':
      result = Memory.getMemoryRecommendations(goal);
      break;
    case 'dashboardImageIntake':
      result = args.precomputed || { ok: false, version: VERSION, status: 'manualRequired', blockers: ['Use /dashboard/image/intake or tools\\bridge.cmd dashboard image-intake <imagePath>.'] };
      break;
    case 'dashboardImageAnalyze':
      result = args.precomputed || await ImagePipeline.analyze(args.referenceId || args.id || args.imagePath || args.path || args.source || goal, { source: 'dashboard.imageAnalyze' });
      break;
    case 'dashboardImageWorldcompile':
      result = args.precomputed || await ImagePipeline.worldcompile(args.referenceId || args.id || args.imagePath || args.path || args.source || goal, { source: 'dashboard.imageWorldcompile' });
      break;
    case 'dashboardImageTlsCheck':
      result = args.precomputed || await require('../ai-orchestrator').getConnectivityReport({ source: 'dashboard.command.imageTlsCheck' });
      break;
    case 'referenceAnalyze':
      result = await ReferenceLab.analyzeReference(args.source || args.path || args.imagePath || goal, { source: 'dashboard.referenceAnalyze' });
      break;
    case 'reconstructInfer':
      result = Reconstruction.createInferenceReport(goal, { source: 'dashboard.reconstructInfer' });
      break;
    case 'worldcompileCompile':
      result = await WorldCompiler.getWorldCompilerCompileReport(goal, { source: 'dashboard.worldcompileCompile' });
      break;
    case 'worldcompilePackage':
      result = await WorldCompiler.getWorldCompilerPackage(goal, { source: 'dashboard.worldcompilePackage' });
      break;
    case 'executePreview':
      result = Execution.preview(goal, { source: 'dashboard.executePreview', system: args.system || args.executionSystem });
      break;
    case 'executeApply':
      if (!options.approved) {
        result = {
          ok: false,
          version: VERSION,
          status: 'manualRequired',
          action,
          goal,
          reason: 'dashboardApplyRequiresApproval',
          warnings: ['Run Execute Preview first, then approve the pending dashboard action.'],
          blockers: [],
          nextCommand: 'Use POST /dashboard/approve or the Approve button.',
        };
      } else if (typeof options.executeApply === 'function') {
        result = await options.executeApply(goal, args);
      } else {
        result = Execution.apply(goal, { source: 'dashboard.executeApply.offlinePlan', system: args.system || args.executionSystem });
      }
      break;
    case 'executeVerify':
      if (typeof options.executeVerify === 'function') {
        result = await options.executeVerify(args.transactionId || args.tx || goal, args);
      } else {
        result = Execution.verify(args.transactionId || args.tx || goal, { source: 'dashboard.executeVerify' });
      }
      break;
    case 'executeRollback':
      if (!args.transactionId && !args.tx) {
        result = {
          ok: false,
          version: VERSION,
          status: 'manualRequired',
          action,
          goal,
          warnings: [],
          blockers: ['Rollback requires a transactionId from an execution receipt.'],
          nextCommand: 'tools\\bridge.cmd execute transactions',
        };
      } else if (typeof options.executeRollback === 'function') {
        result = await options.executeRollback(args.transactionId || args.tx, args);
      } else {
        result = Execution.rollbackPlan(args.transactionId || args.tx);
      }
      break;
    case 'visualCritique':
      result = Visual.createCritiqueReport(goal, { source: 'dashboard.visualCritique' });
      break;
    case 'fidelityCompare':
      result = await Fidelity.compare(goal, { source: 'dashboard.fidelityCompare' });
      break;
    case 'qaLaunch':
      result = QaSwarm.createLaunchReadinessReport(goal, { source: 'dashboard.qaLaunch' });
      break;
    case 'autopilotReport':
      result = Autopilot.createFinalReport(goal, { source: 'dashboard.autopilotReport' });
      break;
    case 'memoryLearn':
      result = Memory.learnFromProductionReport(goal, { source: 'dashboard.memoryLearn', note: args.note || args.text || goal });
      break;
    default:
      result = { ok: false, version: VERSION, status: 'blocked', blockers: [`Unhandled dashboard action: ${action}`] };
  }

  return redact({
    ok: result && result.ok !== false,
    version: VERSION,
    at: nowIso(),
    action,
    goal,
    referenceId: result && result.referenceId ? result.referenceId : args.referenceId,
    mode: result && result.mode ? result.mode : undefined,
    apiConfigured: result && Object.prototype.hasOwnProperty.call(result, 'apiConfigured') ? result.apiConfigured : undefined,
    actualVisionUsed: result && Object.prototype.hasOwnProperty.call(result, 'actualVisionUsed') ? result.actualVisionUsed : undefined,
    result,
    resultSummary: resultSummary(result),
    warnings: result && Array.isArray(result.warnings) ? result.warnings : [],
    blockers: result && Array.isArray(result.blockers) ? result.blockers : [],
    nextCommand: result && result.nextCommand ? result.nextCommand : 'tools\\bridge.cmd dashboard state',
  });
}

module.exports = { extractGoal, runAllowedAction };
